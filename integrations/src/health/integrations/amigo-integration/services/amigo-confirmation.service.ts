import { Injectable, Logger } from '@nestjs/common';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { ConfirmScheduleV2, ListSchedulesToConfirmV2, MatchFlowsConfirmation } from '../../../integrator/interfaces';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import { AmigoApiService } from './amigo-api.service';
import { FlowService } from '../../../flow/service/flow.service';
import {
  AmigoConfirmOrCancelScheduleParamsRequest,
  AmigoConfirmOrCancelScheduleResponse,
  AmigoPatientScheduleParamsRequest,
} from '../interfaces/base-register.interface';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import * as moment from 'moment';
import { convertPhoneNumber, formatPhone } from '../../../../common/helpers/format-phone';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityDocument, OrganizationUnitEntityDocument } from '../../../entities/schema';
import { EntityType } from '../../../interfaces/entity.interface';
import { EntitiesService } from '../../../entities/services/entities.service';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import { DoctorData } from '../../botdesigner-integration/interface/entities';
import { OrganizationUnitData } from '../../clinic-integration/interfaces';
import { castObjectIdToString } from 'common/helpers/cast-objectid';
import { AmigoConfirmationErpParams } from '../interfaces/amigo-confirmation-erp-params.interface';

export enum ConfirmOrCancelConfirmation {
  confirmed = 'confirmed',
  canceled = 'canceled',
}

@Injectable()
export class AmigoConfirmationService {
  private logger = new Logger(AmigoConfirmationService.name);
  private dateFormat = 'YYYY-MM-DDTHH:mm:ss';

  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly apiService: AmigoApiService,
    private readonly flowService: FlowService,
    private readonly entitiesService: EntitiesService,
  ) {}

  public async confirmOrCancelSchedule(
    type: ConfirmOrCancelConfirmation,
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    try {
      const schedule = await this.schedulesService.checkCanConfirmScheduleAndReturn(
        castObjectIdToString(integration._id),
        scheduleCode,
        scheduleId,
      );

      const payload: AmigoConfirmOrCancelScheduleParamsRequest = {
        attendance_id: schedule.scheduleCode,
        patient_id: schedule.patientCode,
        status: type,
      };

      let responseData: AmigoConfirmOrCancelScheduleResponse;

      responseData = await this.apiService.updateStatusSchedule(integration, payload);

      if (responseData.data) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: !!responseData?.data };
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(`AmigoConfirmationService.${this.confirmOrCancelSchedule.name}`, error);
    }
  }

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<AmigoConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate, erpParams } = data;

    const payload: AmigoPatientScheduleParamsRequest = {
      start_date: moment(startDate).format(this.dateFormat),
      end_date: moment(endDate).format(this.dateFormat),
    };

    let schedules = await this.apiService.listPatientSchedules(integration, payload);

    if (erpParams.filterAgendaEventIds?.length) {
      schedules = schedules.filter((sch) => erpParams.filterAgendaEventIds.includes(String(sch?.agenda_event?.id)));
    }

    if (erpParams.omitAgendaEventIds?.length) {
      schedules = schedules.filter((sch) => !erpParams?.omitAgendaEventIds?.includes(String(sch?.agenda_event?.id)));
    }

    const organizationUnitSet = new Set([]);
    schedules.forEach((schedulerDate) => organizationUnitSet.add(schedulerDate.place.id));

    const organizationUnits: OrganizationUnitEntityDocument[] = await this.entitiesService.getValidEntitiesbyCode(
      integration._id,
      Array.from(organizationUnitSet),
      EntityType.organizationUnit,
      {},
    );

    const organizationUnitsData = {};
    organizationUnits.forEach((organizationUnit) => {
      organizationUnitsData[organizationUnit.code] = organizationUnit.data;
    });

    return schedules.map((schedule) => {
      return {
        appointmentTypeCode: null,
        appointmentTypeName: null,
        doctorCode: String(schedule.user.id),
        doctorName: schedule.user.name,
        organizationUnitCode: String(schedule.place.id),
        organizationUnitName: schedule.place.name,
        procedureCode: String(schedule.agenda_event.id),
        procedureName: schedule.agenda_event.name,
        scheduleDate: moment(schedule.start_date).utc(false).format(this.dateFormat),
        scheduleCode: String(schedule.id),
        insuranceCode: String(schedule.insurance_id),
        insuranceName: null,
        specialityCode: null,
        specialityName: null,
        organizationUnitAddress: organizationUnitsData?.[schedule?.place?.id]?.address,
        patient: {
          name: schedule.patient.name,
          email: '-1',
          cpf: schedule.patient.cpf,
          bornDate: schedule.patient.born,
          code: String(schedule.patient.id),
          phones: [
            schedule.patient.contact_cellphone
              ? formatPhone(convertPhoneNumber(schedule.patient.contact_cellphone))
              : '',
          ],
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

        const { organizationUnit, procedure, appointmentType, doctor, speciality } = scheduleCorrelation;

        const scheduleObject: ConfirmationScheduleSchedule = {
          scheduleId: schedule.id,
          scheduleCode: schedule.scheduleCode,
          scheduleDate: moment(schedule.scheduleDate).format(this.dateFormat),
          organizationUnitAddress:
            (organizationUnit?.data as OrganizationUnitData)?.address || schedule.organizationUnitAddress,
          organizationUnitName: organizationUnit?.friendlyName || schedule.organizationUnitName,
          procedureName: procedure?.friendlyName || schedule.procedureName?.trim(),
          specialityName: speciality?.friendlyName || schedule.specialityName?.trim(),
          doctorName: doctor?.name || schedule.doctorName?.trim(),
          doctorObservation: (doctor?.data as DoctorData)?.observation || null,
          principalScheduleCode: schedule.principalScheduleCode,
          isPrincipal: schedule.isPrincipal,
          appointmentTypeName: appointmentType?.friendlyName || schedule.appointmentTypeName,
          guidance: schedule.guidance,
          observation: schedule.observation,
          isFirstComeFirstServed: schedule.isFirstComeFirstServed,
          appointmentTypeCode: schedule.appointmentTypeCode,
          doctorCode: doctor?.code || schedule.doctorCode,
          organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
          procedureCode: procedure?.code || schedule?.procedureCode,
          specialityCode: speciality?.code || schedule?.specialityCode,
          data: schedule.data,
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
      throw INTERNAL_ERROR_THROWER(`AmigoConfirmationService.${this.listSchedulesToConfirm.name}`, error);
    }
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(`AmigoConfirmationService.${this.matchFlowsConfirmation.name}`, error);
    }
  }
}
