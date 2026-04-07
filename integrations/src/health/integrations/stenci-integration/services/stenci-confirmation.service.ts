import { Injectable, Logger } from '@nestjs/common';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { ConfirmScheduleV2, ListSchedulesToConfirmV2, MatchFlowsConfirmation } from '../../../integrator/interfaces';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { SchedulesService } from '../../../schedules/schedules.service';
import { StenciApiService } from './stenci-api.service';
import { FlowService } from '../../../flow/service/flow.service';
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
import {
  StenciAppointmentResponse,
  StenciAppointmentStatus,
  StenciListSchedulesParams,
} from '../interfaces/appointment.interface';
import { StenciConfirmationErpParams } from '../interfaces/confirmation.interface';

@Injectable()
export class StenciConfirmationService {
  private logger = new Logger(StenciConfirmationService.name);
  private dateFormat = 'YYYY-MM-DDTHH:mm:ss';

  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly apiService: StenciApiService,
    private readonly flowService: FlowService,
    private readonly entitiesService: EntitiesService,
  ) {}

  public async confirmOrCancelSchedule(
    type: StenciAppointmentStatus,
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    try {
      const schedule = await this.schedulesService.checkCanConfirmScheduleAndReturn(
        castObjectIdToString(integration._id),
        scheduleCode,
        scheduleId,
      );

      let responseData: StenciAppointmentResponse[];

      responseData = await this.apiService.updateAppointment(integration, String(scheduleId), { status: type });

      if (responseData) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
        return { ok: !!responseData };
      }
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(`StenciConfirmationService.${this.confirmOrCancelSchedule.name}`, error);
    }
  }

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<StenciConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate } = data;

    const payload: StenciListSchedulesParams = {
      startDate: moment.parseZone(startDate).parseZone().format(this.dateFormat),
      endDate: moment.parseZone(endDate).parseZone().format(this.dateFormat),
      limit: 100,
      offset: 0,
      status: StenciAppointmentStatus.scheduled,
    };

    let schedulesResponse = await this.apiService.listSchedulesToConfirm(integration, payload);

    const organizationUnitsList: OrganizationUnitEntityDocument[] = await this.entitiesService.getValidEntities(
      EntityType.organizationUnit,
      integration._id,
    );

    const organizationUnitObject: { [key: string]: OrganizationUnitEntityDocument } = Object.fromEntries(
      organizationUnitsList.map((organizationUnit) => [organizationUnit.code, organizationUnit]),
    );

    const result = schedulesResponse
      .filter((schedules) => schedules.data?.items?.length)
      .map((schedules) => {
        return schedules.data.items.map((schedule) => {
          return {
            appointmentTypeCode: null,
            appointmentTypeName: null,
            doctorCode: String(schedule.professional.id),
            doctorName: schedule.professional.name,
            organizationUnitCode: schedules.organizationUnitCode,
            organizationUnitName: organizationUnitObject[schedules.organizationUnitCode]?.friendlyName,
            procedureCode: String(schedule.services?.[0]?.id),
            procedureName: schedule.services?.[0]?.name,
            scheduleDate: moment.parseZone(schedule.startDate).format(this.dateFormat),
            scheduleCode: String(schedule.id),
            insuranceCode: String(schedule.insurance.id),
            insuranceName: schedule.insurance.name,
            specialityCode: schedule.services?.[0]?.specialty.code,
            specialityName: schedule.services?.[0]?.specialty.name,
            organizationUnitAddress: (organizationUnitObject[schedules.organizationUnitCode]?.data as any)?.address,
            patient: {
              name: schedule.patient.name,
              email: schedule.patient.email,
              cpf: schedule.patient.identity.type === 'cpf' ? schedule.patient.identity.value : '',
              bornDate: schedule.patient.birthDate,
              code: String(schedule.patient.id),
              phones: [schedule.patient.cellphone ? formatPhone(convertPhoneNumber(schedule.patient.cellphone)) : ''],
            },
          };
        });
      });
    return result.flat();
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
          scheduleDate: moment.parseZone(schedule.scheduleDate).parseZone().format(this.dateFormat),
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
      throw INTERNAL_ERROR_THROWER(`StenciConfirmationService.${this.listSchedulesToConfirm.name}`, error);
    }
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER(`StenciConfirmationService.${this.matchFlowsConfirmation.name}`, error);
    }
  }
}
