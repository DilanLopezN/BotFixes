import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { EntityDocument, ScheduleType } from '../../../entities/schema';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ValidateScheduleConfirmation,
  ExtractType,
} from '../../../integrator/interfaces';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import { TdsaGetPatient, TdsaListSchedulesParamsRequest, TdsaSchedule } from '../interfaces';
import { OrganizationUnitData } from '../interfaces/entities';
import { TdsaApiService } from './tdsa-api.service';
import { TdsaHelpersService } from './tdsa-helpers.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { TdsaListSchedulesErpParams } from '../interfaces/tdsa-list-schedule-erp-params.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class TdsaConfirmationService {
  private logger = new Logger(TdsaConfirmationService.name);

  constructor(
    private readonly apiService: TdsaApiService,
    private readonly helperService: TdsaHelpersService,
    private readonly flowService: FlowService,
    private readonly entitiesService: EntitiesService,
    private readonly schedulesService: SchedulesService,
  ) {}

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaConfirmationService.matchFlowsConfirmation', error);
    }
  }

  public async getScheduleGuidance(
    integration: IntegrationDocument,
    { scheduleCodes, scheduleIds }: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    try {
      const schedules = await this.schedulesService.getGuidanceByScheduleCodes(integration, scheduleCodes, scheduleIds);
      for (const schedule of schedules) {
        const guidance = await this.apiService.getGuidance(integration, schedule.procedureCode);
        schedule.guidance = guidance.PreOrientacao?.replace?.(/\\n/g, '\n');
      }
      return schedules;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaConfirmationService.getScheduleGuidance', error);
    }
  }

  async getSchedule(integration: IntegrationDocument, scheduleCode: string): Promise<ExtractedSchedule[]> {
    const payload: TdsaListSchedulesParamsRequest = {
      idAgendamento: Number(scheduleCode),
    };

    const tdsaSchedules = await this.apiService.listSchedules(integration, payload);
    return await this.transformInternalSchedulesToExtractedSchedules(integration, tdsaSchedules);
  }

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<TdsaListSchedulesErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate } = data;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const erpParams: TdsaListSchedulesErpParams = data?.erpParams || {};

    const isNoShowRecover = erpParams?.EXTRACT_TYPE === ExtractType.recover_lost_schedule;

    const payload: TdsaListSchedulesParamsRequest = {
      dataInicio: moment(startDate).format(dateFormat),
      dataFim: moment(endDate).format(dateFormat),
    };

    let tdsaSchedules = await this.apiService.listSchedules(integration, payload);

    // API não possui filtro de status
    // filtro em memória
    // status = 5 - faltou
    if (isNoShowRecover) {
      // inclui status 5 no filtro de status para retornar agendamentos faltosos do método transform
      erpParams.filterStatus = erpParams.filterStatus?.includes(5)
        ? erpParams.filterStatus
        : [...(erpParams.filterStatus || []), 5];

      tdsaSchedules = tdsaSchedules.filter((schedule) => schedule?.Status === 5);
    }

    return this.transformInternalSchedulesToExtractedSchedules(integration, tdsaSchedules, data);
  }

  private async transformInternalSchedulesToExtractedSchedules(
    integration: IntegrationDocument,
    schedules: TdsaSchedule[],
    data?: ListSchedulesToConfirmV2<TdsaListSchedulesErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const erpParams = data?.erpParams;
    const patientIds = new Set<string>();
    const extractedSchedules: ExtractedSchedule[] = [];

    schedules?.forEach((tdsaSchedule) => {
      if (
        erpParams?.omitProcedureCodeList?.length &&
        erpParams?.omitProcedureCodeList?.includes(String(tdsaSchedule.IdProcedimento))
      ) {
        return;
      }

      if (erpParams?.filterTelemedicine && !tdsaSchedule.Telemedicina) {
        return;
      }

      if (erpParams?.checkRangePeriodByHour) {
        const scheduleDateNumber = moment(tdsaSchedule.Data).valueOf();
        const startDateNumber = moment(data.startDate).valueOf();
        const endDateNumber = moment(data.endDate).valueOf();
        // Omite caso seja maior que o endDate ou menor que start date.
        // Essa regra é necessária pois a api deles pega o startDate e endDate e pega o inicio e o fim do dia
        // e em alguns casos de uso precisamos das confirmações de uma hora especifica
        if (scheduleDateNumber > endDateNumber || scheduleDateNumber < startDateNumber) {
          return;
        }
      }

      const filterStatus = erpParams?.filterStatus || [1];

      if (filterStatus.includes(tdsaSchedule.Status)) {
        patientIds.add(String(tdsaSchedule.IdPaciente));
        const extractedSchedule: ExtractedSchedule = {
          doctorCode: String(tdsaSchedule.IdProfissional),
          insuranceCode: String(tdsaSchedule.IdConvenio),
          procedureCode: String(tdsaSchedule.IdProcedimento),
          procedureName: String(tdsaSchedule.NomeProcedimento),
          specialityName: String(tdsaSchedule.NomeEspecialidade),
          organizationUnitCode: String(tdsaSchedule.IdUnidade),
          specialityCode: String(tdsaSchedule.IdEspecialidade),
          // Tdsa atualmente só agenda consultas, como não sei de onde viria no futuro se é exames
          // então assim por hora
          appointmentTypeCode: ScheduleType.Consultation,
          scheduleCode: String(tdsaSchedule.IdAgendamento),
          scheduleDate: tdsaSchedule.Data,
          patient: {
            emails: [],
            code: String(tdsaSchedule.IdPaciente),
            name: null,
            phones: null,
            cpf: null,
            bornDate: null,
          },
        };

        if (erpParams?.saveTelemedicineLink && tdsaSchedule?.Telemedicina && tdsaSchedule?.LinkTelemedicina) {
          extractedSchedule.data = {
            ...extractedSchedule.data,
            // Esse campo 'data' do schedule serve pra popular templates com variaveis, e nos templates o padrão é com lower case separado com _
            // Por tanto se salvar como 'linkTelemedicina' na hora de parsear para o template vai quebrar. Por isso está como link_telemedicina.
            link_telemedicina: tdsaSchedule?.LinkTelemedicina,
          };
        }

        extractedSchedules.push(extractedSchedule);
      }
    });

    const patientsMap: { [doctorCode: string]: TdsaGetPatient } = {};

    await Promise.all(
      Array.from(patientIds).map((patientId) =>
        this.apiService.getPatient(integration, null, patientId).then((response) => {
          if (response?.Id) {
            patientsMap[patientId] = response;
          }
        }),
      ),
    );

    return extractedSchedules.map((extractedSchedule) => {
      const patient = this.helperService.replacePatient(patientsMap[extractedSchedule.patient.code]);
      const phones = Array.from(
        new Set([patient.cellPhone, patient.phone].filter((phone) => phone && phone.length >= 5)),
      );

      const name = erpParams?.useSocialName && patient?.socialName !== '' ? patient.socialName : patient.name;

      return {
        ...extractedSchedule,
        patient: {
          emails: [patient.email],
          code: patient.code,
          name,
          phones,
          cpf: patient.cpf,
          bornDate: patient.bornDate,
        },
      };
    });
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<TdsaListSchedulesErpParams>,
  ): Promise<ConfirmationSchedule> {
    try {
      const debugLimit = data.erpParams?.debugLimit;
      const debugPhone = data.erpParams?.debugPhoneNumber;
      const debugEmail = data.erpParams?.debugEmail;
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

        const { organizationUnit, procedure, appointmentType, doctor, speciality } = scheduleCorrelation;
        const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

        const scheduleObject: ConfirmationScheduleSchedule = {
          scheduleId: schedule.id,
          scheduleCode: schedule.scheduleCode,
          scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
          organizationUnitAddress:
            (organizationUnit?.data as OrganizationUnitData)?.address || schedule.organizationUnitAddress,
          organizationUnitName: organizationUnit?.friendlyName || schedule.organizationUnitName,
          procedureName: procedure?.friendlyName || schedule.procedureName?.trim(),
          specialityName: speciality?.friendlyName || schedule.specialityName?.trim(),
          doctorName: doctor?.friendlyName || schedule.doctorName?.trim(),
          appointmentTypeName: appointmentType?.friendlyName || schedule.appointmentTypeName,
          guidance: schedule.guidance,
          observation: schedule.observation,
          appointmentTypeCode: schedule.appointmentTypeCode,
          doctorCode: doctor?.code || schedule?.doctorCode,
          organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
          procedureCode: procedure?.code || schedule?.procedureCode,
          specialityCode: speciality?.code || schedule.specialityCode,
          data: schedule.data,
        };

        const { patientName, patientCode, patientPhone1, patientPhone2, patientEmail1, patientEmail2 } = schedule;
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

        if (debugEmail) {
          confirmationSchedule.contact.email.push(String(debugEmail).trim());
        } else {
          [patientEmail1, patientEmail2]
            .filter((email) => !!email)
            .forEach((email) => {
              confirmationSchedule.contact.email.push(String(email).trim());
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
              patientBornDate: schedule.patientBornDate,
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
    } catch (error) {
      this.logger.error(error);
      throw INTERNAL_ERROR_THROWER('TdsaConfirmationService.listSchedulesToConfirm', error);
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
      const data = await this.apiService.listSchedules(integration, { idAgendamento: Number(schedule.scheduleCode) });
      const tdsaSchedule = data?.[0];

      // se já estiver cancelado, salva como cancelado e retorna
      if (tdsaSchedule?.Status === 2) {
        await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      let canceledSchedule: boolean = false;

      try {
        const scheduleNumber = await this.apiService.cancelSchedule(integration, Number(schedule.scheduleCode));
        canceledSchedule = !!scheduleNumber;
      } catch (error) {
        if (error?.response?.error?.includes('já cancelado')) {
          canceledSchedule = true;
        }
      }

      if (canceledSchedule) {
        await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      return { ok: false };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaConfirmationService.cancelSchedule', error);
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
      const data = await this.apiService.listSchedules(integration, { idAgendamento: Number(schedule.scheduleCode) });
      const tdsaSchedule = data?.[0];

      // se já estiver confirmado, atualiza no banco e retorna que foi confirmado
      if (tdsaSchedule?.Status === 4) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
        // se já foi cancelado, retorna que foi confirmado
      } else if (tdsaSchedule?.Status === 2) {
        return { ok: true };
      }

      let confirmedSchedule: boolean = false;

      try {
        const scheduleNumber = await this.apiService.confirmSchedule(integration, Number(schedule.scheduleCode));
        confirmedSchedule = !!scheduleNumber;
      } catch (error) {
        if (error?.response?.error?.Message?.includes('Verifique o status do agendamento')) {
          confirmedSchedule = false;
        }
      }

      if (confirmedSchedule) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: true };
      }

      return {
        ok: true,
        message: 'O agendamento não foi confirmado.',
      };
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('TdsaConfirmationService.confirmSchedule', error);
    }
  }

  public async validateScheduleData(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ValidateScheduleConfirmation,
  ): Promise<OkResponse> {
    try {
      const result = await this.schedulesService.validateScheduleData(
        integration,
        scheduleCode,
        scheduleId,
        this.getSchedule.bind(this),
      );

      return { ok: result };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('TdsaConfirmationService.validateScheduleData', error);
    }
  }
}
