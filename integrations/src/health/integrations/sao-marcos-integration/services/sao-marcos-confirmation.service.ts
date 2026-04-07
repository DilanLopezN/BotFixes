import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { EntityDocument, SpecialityEntityDocument } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  CancelScheduleV2,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ConfirmScheduleV2,
} from '../../../integrator/interfaces';
import {
  ExtractType,
  ListSchedulesToConfirmV2,
} from '../../../integrator/interfaces/list-schedules-to-confirm.interface';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import {
  SaoMarcoListSchedules,
  SaoMarcoListSchedulesResponse,
  SaoMarcosCancelSchedule,
  SaoMarcosConfirmSchedulePayload,
  SaoMarcosGetPatientResponse,
} from '../interfaces';
import { SaoMarcosApiService } from './sao-marcos-api.service';
import { SaoMarcosHelpersService } from './sao-marcos-helpers.service';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';

@Injectable()
export class SaoMarcosConfirmationService {
  private logger = new Logger(SaoMarcosConfirmationService.name);

  constructor(
    private readonly saoMarcosApiService: SaoMarcosApiService,
    private readonly saoMarcosHelpersService: SaoMarcosHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly schedulesService: SchedulesService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly flowService: FlowService,
  ) {}

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const { startDate, endDate, erpParams } = data;

    const isNoShowRecover = erpParams?.EXTRACT_TYPE === ExtractType.recover_lost_schedule;

    // se o tipo de extração for recuperacao paciente noShow filtra status 0
    // status 0 = Cancelado
    // status 2 = Agendado
    const payload: SaoMarcoListSchedules = {
      dataInicioBusca: moment(startDate).format(dateFormat),
      dataFimBusca: moment(endDate).format(dateFormat),
      status: isNoShowRecover ? '0' : '2',
    };

    let response: SaoMarcoListSchedulesResponse[] = await this.saoMarcosApiService.listSchedules(integration, payload);

    // Como não foi verificado um filtro de status = 0 e de idMotivoCancela = 21, realiza filtro em memória
    // idMotivoCancela = 21 - O paciente não compareceu para a consulta.
    if (isNoShowRecover) {
      response = response.filter((schedule) => schedule?.idMotivoCancela === 21);
    }

    return await this.transformSaoMarcosSchedulesToExtractedSchedules(integration, response ?? [], data);
  }

  private async transformSaoMarcosSchedulesToExtractedSchedules(
    integration: IntegrationDocument,
    schedules: SaoMarcoListSchedulesResponse[],
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const patientIds = new Set<string>();
    const extractedSchedules: ExtractedSchedule[] = [];

    for (const saoMarcosSchedule of schedules) {
      patientIds.add(String(saoMarcosSchedule.paciente.codigoPaciente));

      await this.integrationCacheUtilsService.setPatientSchedulesToConfirmCache(
        integration,
        String(saoMarcosSchedule.codigoAtendimento),
        String(saoMarcosSchedule.paciente.codigoPaciente),
        saoMarcosSchedule,
      );

      const extractedSchedule: ExtractedSchedule = {
        procedureCode: saoMarcosSchedule?.procedimento?.codigo,
        procedureName: saoMarcosSchedule?.procedimento?.nome,
        doctorCode: saoMarcosSchedule?.medico?.codigo,
        doctorName: saoMarcosSchedule?.medico?.nome,
        insuranceCode: saoMarcosSchedule?.convenio?.codigo,
        insuranceName: saoMarcosSchedule?.convenio?.nome,
        insurancePlanCode: saoMarcosSchedule?.plano?.codigo,
        insurancePlanName: saoMarcosSchedule?.plano?.nome,
        specialityCode: saoMarcosSchedule?.especialidade?.codigo,
        specialityName: saoMarcosSchedule?.especialidade?.nome,
        organizationUnitCode: '1', // possui apenas uma unidade, e não retorna a unidade na API
        appointmentTypeCode: saoMarcosSchedule?.tipoAgendamento,
        scheduleCode: saoMarcosSchedule?.codigoAtendimento,
        scheduleDate: saoMarcosSchedule?.dataHorario,
        patient: {
          emails: [saoMarcosSchedule?.paciente?.email],
          code: saoMarcosSchedule?.paciente?.codigoPaciente,
          name: saoMarcosSchedule?.paciente?.nome,
          phones: [saoMarcosSchedule?.paciente?.telefone],
          cpf: null,
          bornDate: null,
        },
      };

      extractedSchedules.push(extractedSchedule);
    }

    const patientsMap: { [patientCode: string]: SaoMarcosGetPatientResponse } = {};

    await Promise.all(
      Array.from(patientIds).map((patientId) =>
        this.saoMarcosApiService.getPatientByCode(integration, patientId).then((response) => {
          if (response) {
            patientsMap[patientId] = response;
          }
        }),
      ),
    );

    return extractedSchedules
      .filter((extractedSchedule) => !!patientsMap[extractedSchedule?.patient?.code])
      .map((extractedSchedule) => {
        const patient = this.saoMarcosHelpersService.replaceSaoMarcosPatient(
          patientsMap[extractedSchedule.patient.code],
        );

        return {
          ...extractedSchedule,
          patient: {
            email: patient.email,
            code: patient.code,
            name: patient.name,
            phones: [patient.cellPhone || patient.phone],
            cpf: patient.cpf,
            bornDate: patient.bornDate,
          },
        };
      });
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    try {
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

      if (!schedules.length) {
        return result;
      }

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

        const { organizationUnit, procedure, appointmentType, doctor, speciality, insurance, insurancePlan } =
          scheduleCorrelation;
        const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

        const scheduleObject: ConfirmationScheduleSchedule = {
          scheduleId: schedule.id,
          scheduleCode: String(schedule.scheduleCode),
          scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
          organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
          organizationUnitName: organizationUnit?.friendlyName,
          organizationUnitAddress: (organizationUnit?.data as any)?.address,
          procedureCode: procedure?.code || schedule?.procedureCode,
          procedureName: procedure?.friendlyName || procedure?.name || schedule.procedureName?.trim(),
          doctorCode: doctor?.code || schedule?.doctorCode,
          doctorName: doctor?.friendlyName || doctor?.name || schedule.doctorName?.trim(),
          appointmentTypeCode:
            appointmentType?.code ||
            schedule.appointmentTypeCode ||
            (speciality as SpecialityEntityDocument)?.specialityType,
          appointmentTypeName: appointmentType?.friendlyName,
          specialityCode: speciality?.code || schedule?.specialityCode,
          specialityName: speciality?.friendlyName || schedule.specialityName,
          insuranceCode: insurance?.code || schedule?.insuranceCode,
          insuranceName: insurance?.friendlyName || schedule?.insuranceName,
          insurancePlanCode: insurancePlan?.code || schedule?.insurancePlanCode,
          insurancePlanName: insurancePlan?.friendlyName || schedule?.insurancePlanName,
        };

        const { patientName, patientCode, patientPhone1, patientPhone2 } = schedule;
        const confirmationSchedule: ConfirmationScheduleDataV2 = {
          contact: {
            phone: [],
            email: [],
            name: patientName?.trim(),
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
    } catch (error) {
      this.logger.error(error);
      throw INTERNAL_ERROR_THROWER('SaoMarcosConfirmationService.listSchedulesToConfirm', error);
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
      const payload: SaoMarcosCancelSchedule = {
        codigo: schedule.scheduleCode,
      };
      const response = await this.saoMarcosApiService.cancelSchedule(integration, payload);

      if (response.codigo) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosConfirmationService.cancelSchedule', error);
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
      const payload: SaoMarcosConfirmSchedulePayload = {
        externalId: schedule.scheduleCode,
      };
      const response = await this.saoMarcosApiService.confirmSchedule(integration, payload);

      if (response?.status === 200) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosConfirmationService.confirmSchedule', error);
    }
  }

  public async getScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    //Sao Marcos não possui
    return null;
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        null,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SaoMarcosService.getConfirmationScheduleById', error);
    }
  }
}
