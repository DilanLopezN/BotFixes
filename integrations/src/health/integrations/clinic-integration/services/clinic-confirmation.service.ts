import { Injectable } from '@nestjs/common';
import { ClinicApiService } from './clinic-api.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowService } from '../../../flow/service/flow.service';
import { SchedulesService } from '../../../schedules/schedules.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
} from '../../../integrator/interfaces';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import * as moment from 'moment';
import { ClinicHelpersService } from './clinic-helpers.service';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { ExtractType } from '../../../integrator/interfaces/list-schedules-to-confirm.interface';
import { EntityDocument, SpecialityEntityDocument } from '../../../entities/schema';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import {
  ClinicCancelSchedule,
  ClinicConfirmSchedule,
  ClinicListSchedulesParams,
  ClinicSchedule,
  SpecialityData,
  ConfirmationCancelErpParams,
} from '../interfaces';
import { castObjectId, castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { ClinicScheduleType } from '../interfaces/clinic-schedule-type.enum';

@Injectable()
export class ClinicConfirmationService {
  constructor(
    private readonly clinicApiService: ClinicApiService,
    private readonly clinicHelpersService: ClinicHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly flowService: FlowService,
    private readonly schedulesService: SchedulesService,
  ) {}

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate, erpParams } = data;

    const requestFilters: ClinicListSchedulesParams = {
      start_date: moment(startDate).format('YYYY-MM-DD'),
      end_date: moment(endDate).format('YYYY-MM-DD'),
    };

    const response = await this.clinicApiService.listSchedules(integration, requestFilters);

    // Verifica se é resgate no show
    const isNoShowRecover = erpParams?.EXTRACT_TYPE === ExtractType.recover_lost_schedule;

    // Filtra os agendamentos baseado no tipo de extração
    let filteredSchedules: ClinicSchedule[] = [];

    if (isNoShowRecover) {
      // Para resgate no show: considera "Paciente faltou" e "Paciente não chegou"
      filteredSchedules =
        response?.result?.items?.filter(
          (schedule) => schedule.status === 'Paciente faltou' || schedule.status === 'Paciente não chegou',
        ) || [];
    } else {
      // Para confirmação normal: aplica os filtros originais
      filteredSchedules =
        response?.result?.items?.filter(
          (schedule) =>
            schedule.status !== 'Paciente desmarcou' &&
            schedule.confirm === 'A Confirmar' &&
            schedule.status === 'Paciente não chegou',
        ) || [];
    }

    return await this.transformClinicSchedulesToExtractedSchedules(integration, filteredSchedules);
  }

  private async transformClinicSchedulesToExtractedSchedules(
    integration: IntegrationDocument,
    schedules: ClinicSchedule[],
  ): Promise<ExtractedSchedule[]> {
    const doctorsIds = new Set<string>();
    const extractedSchedules: ExtractedSchedule[] = [];

    for (const clinicSchedule of schedules) {
      doctorsIds.add(String(clinicSchedule.doctor_id));

      extractedSchedules.push({
        doctorCode: String(clinicSchedule.doctor_id),
        insuranceCode: String(clinicSchedule.healthInsuranceID),
        procedureCode: clinicSchedule.consultationType ? String(clinicSchedule.consultationType) : null,
        procedureName: clinicSchedule.consultationTypeDescription ? clinicSchedule.consultationTypeDescription : null,
        organizationUnitCode: String(1),
        specialityCode: null,
        appointmentTypeCode: this.getAppointmentTypeCodeFromScheduleType(clinicSchedule.typeDescription),
        scheduleCode: String(clinicSchedule.id),
        scheduleDate: this.clinicHelpersService.convertStartDate(
          clinicSchedule.date_schedule,
          clinicSchedule.hour_schedule,
        ),
        patient: {
          code: clinicSchedule.patient_id ? String(clinicSchedule.patient_id) : null,
          name: clinicSchedule.client,
          phones: [clinicSchedule.mobile],
          cpf: String(clinicSchedule.cpf),
          bornDate: moment(clinicSchedule.birthday).format('YYYY-MM-DD'),
        },
      });
    }

    if (!doctorsIds.size) {
      return [];
    }

    const doctorSpecialities: { [doctorCode: string]: string } = {};

    const specialityCboCode = new Set();

    await Promise.all(
      Array.from(doctorsIds).map((doctorId) =>
        this.clinicApiService
          .getDoctor(integration, {
            doctorCode: doctorId,
          })
          .then((response) => {
            if (response?.result?.specialty_id) {
              specialityCboCode.add(String(response?.result?.specialty_id));
              doctorSpecialities[doctorId] = String(response.result.specialty_id);
            }
          }),
      ),
    );
    const validSpecialities = await this.entitiesService.getModel(EntityType.speciality).find({
      integrationId: castObjectId(integration._id),
      'data.cbo': { $in: Array.from(specialityCboCode) },
    });

    let specialitiesMap = validSpecialities.reduce((acc, speciality) => {
      acc[(speciality.data as SpecialityData).cbo] = speciality.code;
      return acc;
    }, {});

    return extractedSchedules.map((extractedSchedule) => {
      return {
        ...extractedSchedule,
        specialityCode: specialitiesMap[doctorSpecialities[Number(extractedSchedule.doctorCode)]] ?? null,
      };
    });
  }

  private getAppointmentTypeCodeFromScheduleType(clinicScheduleType: ClinicScheduleType): string {
    switch (clinicScheduleType) {
      case ClinicScheduleType['Consulta']:
      case ClinicScheduleType['Primeira Consulta']:
      case ClinicScheduleType['Retorno']:
      case ClinicScheduleType['Compromisso']:
      case ClinicScheduleType['WEB']: {
        return 'C';
      }
      case ClinicScheduleType['Exame']: {
        return 'E';
      }
      case ClinicScheduleType['Cirurgia']: {
        return 'CI';
      }
      default:
        null;
    }
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

    const validSpecialities = await this.entitiesService.getModel(EntityType.speciality).find({
      integrationId: castObjectId(integration._id),
      code: { $in: correlationsKeysData[EntityType.speciality] ?? [] },
    });

    delete correlationsKeysData[EntityType.speciality];

    // cria um objeto em memória com as entidades encontradas em todos os agendamentos
    // para não ir no mongo consultar diversas vezes o mesmo registro
    const correlationData: { [entityType: string]: { [entityCode: string]: EntityDocument } } =
      await this.entitiesService.createCorrelationDataKeys(correlationsKeysData, integration._id);

    // sobrescreve o dado, pois o valor que retorna na listagem de horários tem um id diferente que está dentro do .data
    // e não no código da entidade
    if (validSpecialities?.length) {
      const specialitiesMap = validSpecialities.reduce((acc, speciality) => {
        acc[speciality.code] = speciality;
        return acc;
      }, {});

      correlationData[EntityType.speciality] = specialitiesMap;
    }

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
        procedureName: procedure?.friendlyName || procedure?.name || schedule.procedureName?.trim(),
        doctorName: doctor?.friendlyName || doctor?.name || schedule.doctorName?.trim(),
        appointmentTypeName: appointmentType?.friendlyName,
        specialityName: speciality?.friendlyName || schedule.specialityName,
        doctorCode: doctor?.code || schedule?.doctorCode,
        organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
        procedureCode: procedure?.code || schedule?.procedureCode,
        appointmentTypeCode:
          appointmentType?.code ||
          schedule.appointmentTypeCode ||
          (speciality as SpecialityEntityDocument)?.specialityType,
        specialityCode: speciality?.code || schedule?.specialityCode,
      };

      const { patientName, patientCode, patientPhone1, patientPhone2 } = schedule;
      const confirmationSchedule: ConfirmationScheduleDataV2 = {
        contact: {
          phone: [],
          email: [],
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
      throw INTERNAL_ERROR_THROWER('ClinicConfirmationService.matchFlowsConfirmation', error);
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId, erpParams }: CancelScheduleV2<ConfirmationCancelErpParams>,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanCancelScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      const data = await this.clinicApiService.getOneSchedule(integration, {
        booking_id: schedule.scheduleCode,
      });
      if (!data?.result?.id || data?.result?.confirm !== 'A Confirmar') {
        await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: false };
      }
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('ClinicConfirmationService.cancelSchedule getOneSchedule', error);
    }

    try {
      const payload: ClinicCancelSchedule = { scheduleCode: schedule.scheduleCode };
      if (!erpParams?.useUpdateToCancel) {
        await this.clinicApiService.cancelSchedule(integration, payload);
      } else {
        await this.clinicApiService.updateToCanceledSchedule(integration, payload);
      }
      await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);

      return { ok: true };
    } catch (error) {
      console.error(error);
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
      const data = await this.clinicApiService.getOneSchedule(integration, {
        booking_id: schedule.scheduleCode,
      });
      if (!data?.result?.id || data?.result?.confirm !== 'A Confirmar') {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: false };
      }
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('ClinicConfirmationService.confirmSchedule getOneSchedule', error);
    }

    try {
      const payload: ClinicConfirmSchedule = { scheduleCode: schedule.scheduleCode };
      await this.clinicApiService.confirmSchedule(integration, payload);
      await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);

      return { ok: true };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('ClinicConfirmationService.confirmSchedule', error);
    }
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        null,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ClinicConfirmationService.getConfirmationScheduleById', error);
    }
  }
}
