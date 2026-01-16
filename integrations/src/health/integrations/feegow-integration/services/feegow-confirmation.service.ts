import { Injectable } from '@nestjs/common';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import * as moment from 'moment';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  ExtractType,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
} from '../../../integrator/interfaces';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { FeegowApiService } from './feegow-api.service';
import {
  FeegowCancelSchedule,
  FeegowConfirmSchedule,
  FeegowPatientSchedules,
  FeegowScheduleResponse,
} from '../interfaces';
import { FeegowHelpersService } from './feegow-helpers.service';
import { EntityType } from '../../../interfaces/entity.interface';
import { EntityDocument } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { formatPhone } from '../../../../common/helpers/format-phone';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { FeegowConfirmationErpParams } from '../interfaces/feegow-confirmation-erp-params.interface';

@Injectable()
export class FeegowConfirmationService {
  constructor(
    private readonly apiService: FeegowApiService,
    private readonly helpersService: FeegowHelpersService,
    private readonly schedulesService: SchedulesService,
    private readonly flowService: FlowService,
    private readonly entitiesService: EntitiesService,
  ) {}

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<FeegowConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate, erpParams } = data;

    const requestFilters: FeegowPatientSchedules = {
      data_start: moment(startDate).format('DD-MM-YYYY'),
      data_end: moment(endDate).format('DD-MM-YYYY'),
      status_id: 1,
    };

    if (erpParams?.EXTRACT_TYPE === ExtractType.recover_lost_schedule) {
      requestFilters.status_id = 6;
    }

    const response = await this.apiService.listSchedules(integration, requestFilters);
    let feegowSchedules = response?.content ?? [];

    // Filter out appointments with encaixe = true if omitEncaixe is provided
    if (erpParams?.omitEncaixe && feegowSchedules.length) {
      feegowSchedules = feegowSchedules.filter((schedule) => !schedule.encaixe);
    }

    let schedules = await this.transformFeegowSchedulesToExtractedSchedules(integration, feegowSchedules, data);

    if (erpParams?.filterAppointmentType?.length) {
      schedules = schedules?.filter((schedule) =>
        erpParams.filterAppointmentType.includes(schedule.appointmentTypeCode),
      );
    }

    return schedules || [];
  }

  private async transformFeegowSchedulesToExtractedSchedules(
    integration: IntegrationDocument,
    schedules: FeegowScheduleResponse[],
    data: ListSchedulesToConfirmV2<FeegowConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const erpParams = data.erpParams;
    return Promise.all(
      schedules?.map(async (feegowSchedule) => {
        const scheduleDate = this.helpersService.formatScheduleDate(feegowSchedule);
        const schedule: ExtractedSchedule = {
          patient: {
            code: String(feegowSchedule.paciente_id),
            phones: [],
            bornDate: '',
            name: '',
            cpf: '',
            emails: [],
          },
          scheduleCode: String(feegowSchedule.agendamento_id),
          scheduleDate,
          procedureCode: String(feegowSchedule.procedimento_id),
          doctorCode: String(feegowSchedule.profissional_id),
          organizationUnitCode: String(feegowSchedule.unidade_id),
          insuranceCode: String(feegowSchedule.convenio_id ?? '-1'),
          specialityCode: String(feegowSchedule.especialidade_id),
          appointmentTypeCode: '',
        };
        try {
          const response = await this.apiService.getPatientByCode(integration, String(feegowSchedule.paciente_id));
          const patient = response?.content;

          if (patient?.id) {
            const phones = [];

            if (patient.celulares?.length) {
              const phonesToAdd = patient.celulares
                .filter((number) => !!number && number?.length > 5)
                .map((number) => formatPhone(number));
              if (phonesToAdd?.length) {
                phones.push(...phonesToAdd);
              }
            }

            if (patient.telefones?.length) {
              const phonesToAdd = patient.telefones
                .filter((number) => !!number && number?.length > 5)
                .map((number) => formatPhone(number));
              if (phonesToAdd?.length) {
                phones.push(...phonesToAdd);
              }
            }

            schedule.patient.phones = phones;

            if (patient.email?.length) {
              schedule.patient.emails = [patient.email.filter((email) => !!email)?.[0]];
            }

            if (patient.nascimento) {
              schedule.patient.bornDate = patient.nascimento.split('-').reverse().join('-') ?? '';
            }

            if (patient.nome) {
              schedule.patient.name = patient.nome?.trim();
            }
          }
        } catch (e) {}

        const defaultData = await this.helpersService.getDefaultDataFromSchedule(integration, feegowSchedule);

        if (defaultData?.appointmentType) {
          schedule.appointmentTypeCode = defaultData.appointmentType;
        }

        if (defaultData?.speciality) {
          if (!erpParams?.ignoreSpecialityFromProcedure || !schedule?.specialityCode) {
            schedule.specialityCode = defaultData.speciality;
          }
        }

        if (defaultData?.occupationArea) {
          schedule.occupationAreaCode = defaultData.occupationArea;
        }

        return schedule;
      }),
    );
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

      const { organizationUnit, procedure, appointmentType, doctor, speciality, insurance } = scheduleCorrelation;
      const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

      const scheduleObject: ConfirmationScheduleSchedule = {
        scheduleId: schedule.id,
        scheduleCode: String(schedule.scheduleCode),
        scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
        organizationUnitAddress: (organizationUnit?.data as any)?.address,
        organizationUnitName: organizationUnit?.friendlyName,
        procedureName: procedure?.name || schedule.procedureName?.trim(),
        doctorName: doctor?.name || schedule.doctorName?.trim(),
        appointmentTypeName: appointmentType?.friendlyName,
        specialityName: speciality?.friendlyName || null,
        doctorCode: doctor?.code || schedule?.doctorCode,
        organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
        procedureCode: procedure?.code || schedule?.procedureCode,
        appointmentTypeCode: appointmentType?.code || schedule.appointmentTypeCode,
        specialityCode: speciality?.code || schedule.specialityCode,
        insuranceCode: insurance?.code || schedule.insuranceCode,
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
          filters: {
            patientBornDate: moment(schedule.patientBornDate).format('YYYY-MM-DD'),
            patientCpf: schedule.patientCpf,
          },
        });

        if (actions?.length) {
          confirmationSchedule.actions = actions;
        }
      }

      if (canConfirmActive) {
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
      throw INTERNAL_ERROR_THROWER('FeegowConfirmationService.matchFlowsConfirmation', error);
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
      const payload: FeegowCancelSchedule = {
        agendamento_id: Number(schedule.scheduleCode),
        motivo_id: 1,
        obs: 'Cancelado via chatbot',
      };
      const response = await this.apiService.cancelSchedule(integration, payload);

      if (response?.success) {
        await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicConfirmationService.cancelSchedule', error);
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanConfirmScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      const payload: FeegowConfirmSchedule = {
        AgendamentoID: Number(schedule.scheduleCode),
        Obs: 'Paciente confirmou o comparecimento via chatbot',
        StatusID: 7,
      };
      const response = await this.apiService.confirmSchedule(integration, payload);

      if (response?.success) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicConfirmationService.confirmSchedule', error);
    }
  }
}
