import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { EntityDocument } from '../../../entities/schema';
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
import { DoctorData, OrganizationUnitData } from '../interface/entities';
import { BotdesignerHelpersService } from './botdesigner-helpers.service';
import { BotdesignerApiService } from './botdesigner-api.service';
import { CancelSchedule, ConfirmSchedule, ListSchedulesFilters, Schedule } from 'kissbot-health-core';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class BotdesignerConfirmationService {
  private logger = new Logger(BotdesignerConfirmationService.name);

  constructor(
    private readonly botdesignerHelperService: BotdesignerHelpersService,
    private readonly flowService: FlowService,
    private readonly entitiesService: EntitiesService,
    private readonly botdesignerApiService: BotdesignerApiService,
    private readonly schedulesService: SchedulesService,
  ) {}

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      return await this.schedulesService.matchFlowsConfirmation(castObjectIdToString(integration._id), data);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerConfirmationService.matchFlowsConfirmation', error);
    }
  }

  async getSchedule(integration: IntegrationDocument, scheduleCode: string): Promise<Schedule[]> {
    const payload: ListSchedulesFilters = {
      params: {
        scheduleCode,
      },
      offset: 0,
      limit: 1,
    };

    return this.botdesignerApiService.listSchedules(integration, payload);
  }

  public async getScheduleGuidance(
    integration: IntegrationDocument,
    { scheduleIds, scheduleCodes }: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    try {
      return await this.schedulesService.getGuidanceByScheduleCodes(integration, scheduleCodes, scheduleIds);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('BotdesignerConfirmationService.getScheduleGuidance', error);
    }
  }

  async listSchedulesToActiveSending(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate, maxResults, page, erpParams } = data;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const nextPage = page - 1;

    const payload: ListSchedulesFilters = {
      params: {
        startDate: moment(startDate).format(dateFormat),
        endDate: moment(endDate).format(dateFormat),
        erpParams,
        scheduleCode: data.scheduleCode,
      },
    };

    if (maxResults && page) {
      payload.offset = (nextPage < 0 ? 0 : nextPage) * maxResults;
      payload.limit = maxResults ?? 20;
    }

    const schedules = await this.botdesignerApiService.listSchedules(integration, payload);
    return this.transformInternalSchedulesToExtractedSchedules(integration, schedules);
  }

  private transformInternalSchedulesToExtractedSchedules(
    integration: IntegrationDocument,
    schedules: Schedule[],
  ): ExtractedSchedule[] {
    return schedules?.map((internalSchedule) => {
      const schedule = {
        ...internalSchedule,
        specialityCode: this.botdesignerHelperService.createCompositeSpecialityCode(
          integration,
          internalSchedule.specialityCode,
          internalSchedule.appointmentTypeCode,
        ),
        procedureCode: internalSchedule.procedureCode
          ? this.botdesignerHelperService.createCompositeProcedureCode(
              integration,
              internalSchedule.procedureCode,
              internalSchedule.specialityCode,
              internalSchedule.appointmentTypeCode,
              null,
              internalSchedule.lateralityCode || this.botdesignerHelperService.getHandedness(integration._id),
            )
          : null,
        insurancePlanCode: !!internalSchedule?.insurancePlanCode
          ? this.botdesignerHelperService.createCompositePlanCode(
              integration,
              internalSchedule.insurancePlanCode,
              internalSchedule.insuranceCode,
            )
          : null,
        insuranceSubPlanCode:
          !!internalSchedule?.insuranceSubPlanCode && !!internalSchedule?.insurancePlanCode
            ? this.botdesignerHelperService.createCompositeSubPlanCode(
                integration,
                internalSchedule.insuranceSubPlanCode,
                internalSchedule.insurancePlanCode,
                internalSchedule.insuranceCode,
              )
            : null,
        insuranceCategoryCode: !!internalSchedule?.insuranceCategoryCode
          ? this.botdesignerHelperService.createCompositePlanCategoryCode(
              integration,
              internalSchedule.insuranceCategoryCode,
              internalSchedule.insuranceCode,
            )
          : null,
      };

      internalSchedule.data = {
        ...(internalSchedule.data ?? {}),
        appointmentTypeCode: internalSchedule.appointmentTypeCode,
      };

      return schedule;
    });
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    try {
      const debugLimit = data.erpParams?.debugLimit;
      const debugPhone = data.erpParams?.debugPhoneNumber;
      const debugEmail = data.erpParams?.debugEmail;

      const { extractStartedAt, extractEndedAt, schedules } = await this.schedulesService.buildExtraction(
        integration,
        data,
        this.listSchedulesToActiveSending.bind(this),
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
          scheduleCode: schedule.scheduleCode,
          scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
          organizationUnitAddress:
            schedule?.organizationUnitAddress || (organizationUnit?.data as OrganizationUnitData)?.address || null,
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
          insuranceCode: insurance?.code || schedule?.insuranceCode,
          insuranceName: insurance?.name || schedule?.insuranceName,
          insurancePlanName: insurancePlan?.name || schedule?.insurancePlanName,
          insurancePlanCode: insurancePlan?.code || schedule?.insurancePlanCode,
          doctorCode: doctor?.code || schedule.doctorCode,
          organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
          procedureCode: procedure?.code || schedule?.procedureCode,
          specialityCode: speciality?.code || schedule?.specialityCode,
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

      if (debugLimit) {
        result.data = result.data?.slice(0, debugLimit);
      }

      return result;
    } catch (error) {
      this.logger.error(error);
      throw INTERNAL_ERROR_THROWER('BotdesignerConfirmationService.listSchedulesToConfirm', error);
    }
  }

  async cancelSchedule(
    integration: IntegrationDocument,
    { scheduleId, scheduleCode, erpParams }: CancelScheduleV2,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanCancelScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      const payload: CancelSchedule = {
        scheduleCode: schedule.scheduleCode,
        erpParams,
        schedule: {
          patientCode: schedule?.patientCode,
          appointmentTypeCode: schedule?.appointmentTypeCode,
        },
      };
      const response = await this.botdesignerApiService.cancelSchedule(integration, payload);
      if (response?.ok) {
        await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);
      }

      return response;
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('BotdesignerConfirmationService.cancelSchedule', error);
    }
  }

  async confirmSchedule(
    integration: IntegrationDocument,
    { scheduleId, scheduleCode, erpParams }: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanConfirmScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      const payload: ConfirmSchedule = {
        scheduleCode: schedule.scheduleCode,
        erpParams,
        schedule: {
          patientCode: schedule?.patientCode,
          appointmentTypeCode: schedule?.appointmentTypeCode,
        },
      };
      const response = await this.botdesignerApiService.confirmSchedule(integration, payload);
      if (response?.ok) {
        await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId);
      }

      return response;
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('BotdesignerConfirmationService.confirmSchedule', error);
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
      throw INTERNAL_ERROR_THROWER('BotdesignerConfirmationService.validateScheduleData', error);
    }
  }
}
