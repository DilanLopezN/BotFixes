import { Injectable } from '@nestjs/common';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
} from '../../../integrator/interfaces';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import * as moment from 'moment';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowService } from '../../../flow/service/flow.service';
import { SchedulesService } from '../../../schedules/schedules.service';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { DrMobileApiService } from './dr-mobile-api.service';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import {
  DrMobileCancelScheduleParams,
  DrMobileConfirmScheduleParams,
  DrMobileListSchedulesParams,
  DrMobileScheduleConfirmation,
} from '../interfaces';
import { formatPhoneWithDDI } from '../../../../common/helpers/format-phone';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class DrMobileConfirmationService {
  constructor(
    private readonly drMobileApiService: DrMobileApiService,
    private readonly entitiesService: EntitiesService,
    private readonly flowService: FlowService,
    private readonly schedulesService: SchedulesService,
  ) {}

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate } = data;
    const dateFormat = 'YYYY-MM-DD HH:mm:ss';

    const filters: DrMobileListSchedulesParams = {
      dtInicio: moment(startDate).format(dateFormat),
      dtFim: moment(endDate).format(dateFormat),
    };

    const response = await this.drMobileApiService.listSchedules(integration, filters);

    if (!response) {
      return [];
    }

    return await this.transformDrMobileSchedulesToExtractedSchedules(integration, response);
  }

  private async transformDrMobileSchedulesToExtractedSchedules(
    _: IntegrationDocument,
    schedules: DrMobileScheduleConfirmation[],
  ): Promise<ExtractedSchedule[]> {
    const extractedSchedules: ExtractedSchedule[] = [];
    const formatDate = 'YYYY-MM-DDTHH:mm:ss';

    schedules?.forEach((drMobileItem) => {
      const patientData = {
        email: drMobileItem.email,
        code: drMobileItem.cdPaciente ? String(drMobileItem.cdPaciente) : null,
        name: drMobileItem.nmPaciente,
        phones: [],
        cpf: drMobileItem.cpf,
        bornDate: drMobileItem.nascimento ? moment(drMobileItem.nascimento).format('YYYY-MM-DD') : null,
      };

      const phonesSet = new Set();

      if (drMobileItem.celular && (drMobileItem.ddd || drMobileItem.dddCelular)) {
        const phone = formatPhoneWithDDI('55', drMobileItem.ddd || drMobileItem.dddCelular, drMobileItem.celular);
        phonesSet.add(phone);
      }

      if (drMobileItem.telefone && (drMobileItem.ddd || drMobileItem.dddCelular)) {
        const phone = formatPhoneWithDDI('55', drMobileItem.ddd || drMobileItem.dddCelular, drMobileItem.telefone);
        phonesSet.add(phone);
      }

      patientData.phones = Array.from(phonesSet);

      drMobileItem.horarios.forEach((drMobileSchedule) => {
        // se o agendamento já foi confirmado, ou cancelado, não retorna para a listagem
        if (drMobileSchedule.presenca_falta !== 'P' && drMobileSchedule.presenca_falta !== 'F') {
          const schedule = {
            doctorCode: String(drMobileSchedule.prestador.cdPrestador),
            insuranceCode: String(drMobileSchedule.convenio?.codigo_convenio),
            procedureCode: String(drMobileSchedule.item_agendamento.codigo_item),
            organizationUnitCode: String(drMobileSchedule.unidade?.cd_unidade_atendimento),
            specialityCode: String(drMobileSchedule.codigo_servico),
            appointmentTypeCode: null,
            scheduleCode: String(drMobileSchedule.cd_it_agenda),
            scheduleDate: moment(drMobileSchedule.hr_agenda).format(formatDate),
            patient: patientData,
            data: {
              codigo_agenda: drMobileSchedule.codigo_agenda,
            },
          };

          if (drMobileSchedule.item_agendamento?.tipo_item) {
            schedule.appointmentTypeCode = String(
              drMobileSchedule.item_agendamento.tipo_item === 'A' ? ScheduleType.Consultation : ScheduleType.Exam,
            );
          }

          extractedSchedules.push(schedule);
        }
      });
    });

    return extractedSchedules;
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    const debugLimit = data.erpParams?.debugLimit;
    const debugPhone = data.erpParams?.debugPhoneNumber;
    const debugPatientCode = data.erpParams?.debugPatientCode;
    const debugScheduleCode = data.erpParams?.debugScheduleCode;

    const { extractStartedAt, extractEndedAt, schedules } = await this.schedulesService.buildExtraction(
      integration,
      data,
      this.listSchedulesToConfirmData.bind(this),
    );

    const result: ConfirmationSchedule = {
      data: [],
      ommitedData: [],
      metadata: {
        extractedCount: schedules.length ?? 0,
        extractStartedAt,
        extractEndedAt,
      },
    };

    const correlationsKeys: { [key: string]: Set<string> } = {};

    for (const schedule of schedules) {
      const scheduleMap = this.schedulesService.formatScheduleToEntityMap(schedule);

      Object.keys(scheduleMap).forEach((entityType) => {
        const entityCode = scheduleMap[entityType];

        if (entityCode) {
          if (!correlationsKeys[entityType]) {
            correlationsKeys[entityType] = new Set();
          }

          correlationsKeys[entityType].add(entityCode);
        }
      });
    }

    const correlationsKeysData: CorrelationFilterByKeys = Object.keys(EntityType).reduce((acc, key) => {
      if (correlationsKeys[key]?.size) {
        acc[key] = Array.from(correlationsKeys[key]);
      }
      return acc;
    }, {});

    // cria um objeto em memória com as entidades encontradas em todos os agendamentos
    // para não ir no mongo consultar diversas vezes o mesmo registro
    const correlationData: { [entityType: string]: { [entityCode: string]: EntityDocument } } =
      await this.entitiesService.createCorrelationDataKeys(correlationsKeysData, integration._id);

    for await (const schedule of schedules) {
      const scheduleCorrelation: { [entityType: string]: EntityDocument } = {};
      const scheduleMap = this.schedulesService.formatScheduleToEntityMap(schedule);

      Object.keys(scheduleMap).forEach((entityType) => {
        const entityCode = scheduleMap[entityType];
        scheduleCorrelation[entityType] = correlationData[entityType]?.[entityCode];
      });

      // valida através das entidades se pode confirmar `canConfirmActive`
      // se não encontrar a entidade considera true
      const canConfirmActive = Object.values(scheduleCorrelation)
        .filter((entity) => !!entity)
        .every((entity) => entity.canConfirmActive);

      let forceOmmitData = false;

      const { organizationUnit, procedure, appointmentType, doctor, speciality } = scheduleCorrelation;
      const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

      if (!doctor) {
        forceOmmitData = true;
      }

      const scheduleObject: ConfirmationScheduleSchedule = {
        scheduleId: schedule.id,
        scheduleCode: String(schedule.scheduleCode),
        scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
        organizationUnitAddress: (organizationUnit?.data as any)?.address,
        organizationUnitName: organizationUnit?.friendlyName,
        procedureName: procedure?.friendlyName || schedule.procedureName?.trim(),
        doctorName: doctor?.friendlyName || schedule.doctorName?.trim(),
        appointmentTypeName: appointmentType?.friendlyName || null,
        appointmentTypeCode: appointmentType?.code || null,
        specialityCode: speciality?.code || null,
        specialityName: speciality?.friendlyName || null,
        doctorCode: doctor?.code || schedule?.doctorCode,
        organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
        procedureCode: procedure?.code || schedule?.procedureCode,
      };

      const { patientName, patientCode, patientPhone1, patientPhone2 } = schedule;
      const confirmationSchedule: ConfirmationScheduleDataV2 = {
        contact: {
          phone: [],
          name: patientName,
          code: patientCode,
        },
        schedule: scheduleObject,
        actions: [],
      };

      if (debugPhone) {
        confirmationSchedule.contact.phone.push(String(debugPhone).trim());
      } else {
        [patientPhone1, patientPhone2]
          .filter((phone) => !!phone)
          .forEach((phone) => {
            confirmationSchedule.contact.phone.push(String(phone).trim());
          });
      }

      if (canConfirmActive) {
        // realiza match de flows `confirmActive` com as entidades encontradas do nosso lado
        // pelo código
        const actions = await this.flowService.matchFlowsAndGetActions({
          integrationId: integration._id,
          entitiesFilter: scheduleCorrelation,
          targetFlowTypes: [FlowSteps.confirmActive],
        });

        if (actions?.length) {
          confirmationSchedule.actions = actions;
        }
      }

      if (canConfirmActive && !forceOmmitData) {
        result.data.push(confirmationSchedule);
      } else {
        result.ommitedData.push(confirmationSchedule);
      }
    }

    if (debugPatientCode) {
      result.data = result.data?.filter((schedule) => debugPatientCode.includes(schedule.contact?.code));
    }

    if (debugScheduleCode) {
      result.data = result.data?.filter((schedule) => {
        if ('schedule' in schedule) {
          return debugScheduleCode.includes(schedule.schedule?.scheduleCode);
        }
        return false;
      });
    }

    if (debugLimit) {
      result.data = result.data?.slice(0, debugLimit);
    }

    return result;
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('DrMobileConfirmationService.matchFlowsConfirmation', error);
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: CancelScheduleV2,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanCancelScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      const payload: DrMobileCancelScheduleParams = {
        patientCode: Number(schedule.patientCode),
        scheduleCode: schedule.scheduleCode,
      };

      const response = await this.drMobileApiService.cancelSchedule(integration, payload);
      if (response?.retorno?.includes('Agendamento cancelado com sucesso')) {
        await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);
      }

      return { ok: true };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('DrMobileConfirmationService.cancelSchedule', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    try {
      return { ok: true };
      const { data, ...schedule } = await this.schedulesService.checkCanConfirmScheduleAndReturn(
        castObjectIdToString(integration._id),
        scheduleCode,
        scheduleId,
      );
      const payload: DrMobileConfirmScheduleParams = {
        cdPaciente: schedule.patientCode ? Number(schedule.patientCode) : undefined,
        codigo_it_agenda: Number(schedule.scheduleCode),
        tpPresencaFalta: 'P',
        codigo_agenda: data?.codigo_agenda || null,
      };

      await this.drMobileApiService.confirmSchedule(integration, payload);
      await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);

      return { ok: true };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('DrMobileConfirmationService.confirmSchedule', error);
    }
  }
}
