import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { castObjectId, castObjectIdToString } from '../../common/helpers/cast-objectid';
import { removeHTMLTags } from '../../common/helpers/remove-html-tags';
import { EntityDocument } from '../entities/schema';
import { EntitiesService } from '../entities/services/entities.service';
import { IntegrationDocument } from '../integration/schema/integration.schema';
import {
  ListSchedulesToConfirmV2,
  ConfirmationScheduleGuidanceResponse,
  MatchFlowsConfirmation,
} from '../integrator/interfaces';
import * as Sentry from '@sentry/node';
import {
  CorrelationFilter,
  CorrelationFilterByKey,
  CorrelationFilterByKeys,
} from '../interfaces/correlation-filter.interface';
import { EntityType } from '../interfaces/entity.interface';
import { INTEGRATIONS_CONNECTION_NAME } from '../ormconfig';
import { Extractions } from './entities/extractions.entity';
import { SCHEDULE_OVERRIDE_FIELDS, SCHEDULE_UNIQUE_FIELDS, Schedules } from './entities/schedules.entity';
import { ExtractedSchedule } from './interfaces/extracted-schedule.interface';
import { ExtractionStatus } from './interfaces/extractions.interface';
import { ScheduleStatus } from './interfaces/schedules.interface';
import { onlyNumbers } from '../../common/helpers/format-cpf';
import { HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../common/exceptions.service';
import { pick } from 'lodash';
import { FlowAction, FlowActionElement, FlowSteps } from './../../health/flow/interfaces/flow.interface';
import { FlowService } from './../../health/flow/service/flow.service';

@Injectable()
export class SchedulesService {
  private logger = new Logger(SchedulesService.name);
  private readonly fieldsToValidateSchedule: (keyof Schedules)[] = [
    'patientCode',
    'patientCpf',
    'patientBornDate',
    'scheduleDate',
  ];

  constructor(
    @InjectRepository(Schedules, INTEGRATIONS_CONNECTION_NAME)
    private schedulesRepository: Repository<Schedules>,
    @InjectRepository(Extractions, INTEGRATIONS_CONNECTION_NAME)
    private extractionsRepository: Repository<Extractions>,
    private readonly entitiesService: EntitiesService,
    private readonly flowService: FlowService,
  ) {}

  public async getScheduleByCodeOrId(
    integrationId: string,
    scheduleCode?: string,
    scheduleId?: number,
  ): Promise<Schedules> {
    if (!scheduleCode && !scheduleId) {
      return null;
    }

    try {
      const where: FindOptionsWhere<Schedules>[] = [];

      if (scheduleCode) {
        where.push({
          integrationId: castObjectIdToString(integrationId),
          scheduleCode,
        });
      } else if (scheduleId) {
        where.push({
          integrationId: castObjectIdToString(integrationId),
          id: scheduleId,
        });
      }

      return await this.schedulesRepository.findOne({
        where,
      });
    } catch (error) {
      console.error(error);
      this.logger.error('SchedulesService.getScheduleByCodeOrId', error);
      throw error;
    }
  }

  public async getGuidanceByScheduleCodes(
    integration: IntegrationDocument,
    scheduleCodes: string[],
    scheduleIds?: number[],
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    try {
      if (!scheduleIds?.length && !scheduleCodes?.length) {
        return [];
      }

      const where: FindOptionsWhere<Schedules>[] = [];

      if (scheduleIds?.length) {
        where.push({
          integrationId: castObjectIdToString(integration._id),
          id: In(scheduleIds),
        });
      }

      if (scheduleCodes?.length) {
        where.push({
          integrationId: castObjectIdToString(integration._id),
          scheduleCode: In(scheduleCodes),
        });
      }

      return await this.schedulesRepository.find({
        where,
        select: {
          id: true,
          scheduleCode: true,
          guidance: true,
          observation: true,
          appointmentTypeName: true,
          doctorName: true,
          insuranceCategoryName: true,
          insuranceName: true,
          organizationUnitAddress: true,
          patientName: true,
          procedureName: true,
          specialityName: true,
          typeOfServiceName: true,
          organizationUnitName: true,
          procedureCode: true,
          specialityCode: true,
        },
      });
    } catch (error) {
      console.error(error);
      this.logger.error('SchedulesService.getGuidanceByScheduleCodes', error);
      throw error;
    }
  }

  public async getEntitiesData(
    integrationId: string,
    correlationFilter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    const correlationData: CorrelationFilter = {};

    for (const entityType of Object.keys(EntityType)) {
      if (correlationFilter[entityType]) {
        correlationData[entityType] = await this.entitiesService.getEntity(
          entityType as EntityType,
          {
            code: correlationFilter[entityType],
          },
          castObjectId(integrationId),
        );
      }
    }

    return correlationData;
  }

  public async matchFlowsConfirmation(
    integrationId: string,
    { scheduleCode, scheduleId, scheduleIds, trigger }: MatchFlowsConfirmation,
  ): Promise<FlowAction<FlowActionElement>[]> {
    try {
      const actions = [];

      if (!scheduleIds?.length && scheduleId) {
        scheduleIds = [scheduleId];
      }

      for (const id of scheduleIds) {
        const [correlation, schedule] = await this.getEntitiesDataFromSchedule(integrationId, scheduleCode, id);

        if (!schedule) {
          continue;
        }

        const result = await this.flowService.matchFlowsAndGetActions({
          integrationId: castObjectId(integrationId),
          entitiesFilter: correlation,
          targetFlowTypes: [FlowSteps.confirmActive],
          filters: {
            patientBornDate: schedule.patientBornDate,
            patientCpf: schedule.patientCpf,
          },
          trigger,
        });
        actions.push(...result);
      }
      return actions;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('SchedulesService.matchFlowsConfirmation', error);
    }
  }

  public async getEntitiesDataFromSchedule(
    integrationId: string,
    scheduleCode: string,
    scheduleId?: number,
  ): Promise<[CorrelationFilter, Schedules]> {
    const schedule = await this.getScheduleByCodeOrId(integrationId, scheduleCode, scheduleId);

    if (!schedule) {
      return [null, null];
    }

    const correlationFilter: CorrelationFilterByKey = {
      appointmentType: schedule.appointmentTypeCode,
      doctor: schedule.doctorCode,
      insurance: schedule.insuranceCode,
      insurancePlan: schedule.insurancePlanCode,
      insuranceSubPlan: schedule.insuranceSubPlanCode,
      organizationUnit: schedule.organizationUnitCode,
      planCategory: schedule.insuranceCategoryCode,
      procedure: schedule.procedureCode,
      speciality: schedule.specialityCode,
    };

    const data = await this.getEntitiesData(integrationId, correlationFilter);
    return [data, schedule];
  }

  private buildScheduleFromExtractedData(extractedSchedule: ExtractedSchedule): Partial<Schedules> {
    const { patient } = extractedSchedule;

    return {
      appointmentTypeCode: extractedSchedule.appointmentTypeCode,
      doctorCode: extractedSchedule.doctorCode,
      insuranceCategoryCode: extractedSchedule.insuranceCategoryCode,
      insuranceCode: extractedSchedule.insuranceCode,
      insurancePlanCode: extractedSchedule.insurancePlanCode,
      insuranceSubPlanCode: extractedSchedule.insuranceSubPlanCode,
      organizationUnitCode: extractedSchedule.organizationUnitCode,
      patientBornDate: patient.bornDate,
      patientCode: patient.code,
      procedureCode: extractedSchedule.procedureCode,
      patientCpf: onlyNumbers(patient.cpf),
      specialityCode: extractedSchedule.specialityCode,
      scheduleCode: extractedSchedule.scheduleCode,
      scheduleDate: moment(extractedSchedule.scheduleDate).valueOf(),
      patientName: patient.name?.trim(),
      isPrincipal: extractedSchedule.isPrincipal,
      principalScheduleCode: extractedSchedule.principalScheduleCode,
      data: extractedSchedule.data,
    };
  }

  public formatScheduleToEntityMap = (schedule: Schedules | ExtractedSchedule): { [key in EntityType]?: string } => ({
    [EntityType.appointmentType]: schedule.appointmentTypeCode,
    [EntityType.doctor]: schedule.doctorCode,
    [EntityType.insurance]: schedule.insuranceCode,
    [EntityType.insurancePlan]: schedule.insurancePlanCode,
    [EntityType.insuranceSubPlan]: schedule.insuranceSubPlanCode,
    [EntityType.organizationUnit]: schedule.organizationUnitCode,
    [EntityType.planCategory]: schedule.insuranceCategoryCode,
    [EntityType.speciality]: schedule.specialityCode,
    [EntityType.procedure]: schedule.procedureCode,
  });

  public async buildExtraction(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
    listSchedulesToConfirmData: (
      integration: IntegrationDocument,
      data: ListSchedulesToConfirmV2,
    ) => Promise<ExtractedSchedule[]>,
  ): Promise<{ extractStartedAt: number; extractEndedAt: number; schedules: Schedules[] }> {
    const extractStartedAt = +new Date();
    const extractionDefaultFields: Partial<Extractions> = {
      integrationId: castObjectIdToString(integration._id),
      workspaceId: castObjectIdToString(integration.workspaceId),
    };

    const extraction = await this.extractionsRepository.save({
      extractStartedAt,
      createdAt: +new Date(),
      data: null,
      resultsCount: null,
      status: ExtractionStatus.pending,
      ...extractionDefaultFields,
    });

    try {
      const extractedSchedules: ExtractedSchedule[] = await listSchedulesToConfirmData(integration, data);
      const correlationsKeys: { [key: string]: Set<string> } = {};

      for (const schedule of extractedSchedules) {
        const scheduleMap = this.formatScheduleToEntityMap(schedule);

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

      const correlationData: { [entityType: string]: { [entityCode: string]: EntityDocument } } =
        await this.entitiesService.createCorrelationDataKeys(correlationsKeysData, integration._id);

      const schedules = await Promise.all(
        extractedSchedules?.map(async (schedule) => {
          const scheduleCorrelation: { [entityType: string]: EntityDocument } = {};
          const scheduleMap = this.formatScheduleToEntityMap(schedule);

          Object.keys(scheduleMap).forEach((entityType) => {
            const entityCode = scheduleMap[entityType];
            scheduleCorrelation[entityType] = correlationData[entityType]?.[entityCode];
          });

          const { patient } = schedule;
          const {
            organizationUnit,
            procedure,
            appointmentType,
            doctor,
            speciality,
            insurance,
            insurancePlan,
            insuranceSubPlan,
          } = scheduleCorrelation;

          return {
            ...this.buildScheduleFromExtractedData(schedule),
            createdAt: moment().valueOf(),
            integrationId: castObjectIdToString(integration._id),
            workspaceId: castObjectIdToString(integration.workspaceId),
            scheduleStatus: ScheduleStatus.extracted,
            isFirstComeFirstServed: schedule.isFirstComeFirstServed,
            extraction,
            appointmentTypeName: appointmentType?.name || schedule.appointmentTypeName || null,
            doctorName: doctor?.name || schedule.doctorName || null,
            insuranceName: insurance?.name || schedule.insuranceName || null,
            insurancePlanName: insurancePlan?.name || schedule.insurancePlanName || null,
            organizationUnitAddress:
              schedule?.organizationUnitAddress || (organizationUnit?.data as any)?.address || null,
            procedureName: procedure?.name || schedule.procedureName || null,
            specialityName: speciality?.name || schedule.specialityName || null,
            organizationUnitName: organizationUnit?.name || schedule.organizationUnitName || null,
            insuranceSubPlanName: insuranceSubPlan?.name || schedule.insuranceSubPlanName || null,
            guidance: removeHTMLTags(schedule.guidance)?.trim(),
            observation: removeHTMLTags(schedule.observation)?.trim(),
            patientPhone1: patient?.phones?.[0] ?? null,
            patientPhone2: patient?.phones?.[1] ?? null,
            patientEmail1: patient?.emails?.[0] ?? null,
            patientEmail2: patient?.emails?.[1] ?? null,
            patientName: patient?.name?.trim() || null,
            patientBornDate: patient?.bornDate ? moment(patient?.bornDate).format('YYYY-MM-DD') : null,
            patientCode: patient?.code || null,
            patientCpf: onlyNumbers(patient?.cpf) || null,
          } as Schedules;
        }),
      );

      for (const schedule of schedules) {
        let queryData: [string, any[]];

        try {
          const query = this.schedulesRepository
            .createQueryBuilder()
            .insert()
            .values(schedule)
            .orUpdate(SCHEDULE_OVERRIDE_FIELDS, SCHEDULE_UNIQUE_FIELDS);

          queryData = query.getQueryAndParameters();
          await query.execute();
        } catch (error) {
          Sentry.captureEvent({
            message: 'SCHEDULE_INSERT',
            extra: {
              data,
              error,
              queryData,
            },
          });
          console.error(error);
          this.logger.error('SchedulesService.buildExtraction', error);
        }
      }

      const extractEndedAt = +new Date();
      await this.extractionsRepository.update(
        { id: extraction.id },
        {
          resultsCount: schedules.length,
          status: ExtractionStatus.success,
          extractEndedAt,
        },
      );

      return {
        extractStartedAt,
        extractEndedAt,
        schedules,
      };
    } catch (error) {
      Sentry.captureEvent({
        message: 'SCHEDULE_INSERT_ERROR',
        extra: {
          data,
          error,
        },
      });
      console.log(error);
      this.logger.error('SchedulesService.getScheduleByCodeOrId', error);
      await this.extractionsRepository.update(
        { id: extraction.id },
        {
          resultsCount: null,
          status: ExtractionStatus.error,
        },
      );
      throw error;
    }
  }

  public async buildCancelSchedule(
    integration: IntegrationDocument,
    scheduleCode?: string,
    scheduleId?: number,
  ): Promise<boolean> {
    if (!scheduleCode && !scheduleId) {
      return false;
    }

    try {
      const now = moment().valueOf();
      const query = this.schedulesRepository
        .createQueryBuilder()
        .update()
        .set({
          scheduleStatus: ScheduleStatus.canceled,
          canceledAt: now,
          updatedAt: now,
        })
        .where('integrationId = :integrationId', { integrationId: castObjectIdToString(integration._id) });

      if (scheduleCode) {
        query.andWhere('scheduleCode = :scheduleCode', { scheduleCode });
      } else if (scheduleId) {
        query.andWhere('id = :scheduleId', { scheduleId });
      }

      const result = await query.execute();
      return result.affected > 0;
    } catch (error) {
      console.error(error);
      this.logger.error('SchedulesService.buildCancelSchedule', error);
      return false;
    }
  }

  public async buildConfirmSchedule(
    integration: IntegrationDocument,
    scheduleCode: string,
    scheduleId: number,
  ): Promise<boolean> {
    if (!scheduleCode && !scheduleId) {
      return false;
    }

    try {
      const now = moment().valueOf();
      const query = this.schedulesRepository
        .createQueryBuilder()
        .update()
        .set({ scheduleStatus: ScheduleStatus.confirmed, confirmedAt: now, updatedAt: now })
        .where('integrationId = :integrationId', { integrationId: castObjectIdToString(integration._id) });

      if (scheduleCode) {
        query.andWhere('scheduleCode = :scheduleCode', { scheduleCode });
      } else if (scheduleId) {
        query.andWhere('id = :scheduleId', { scheduleId });
      }

      const result = await query.execute();
      return result.affected > 0;
    } catch (error) {
      console.error(error);
      this.logger.error('SchedulesService.buildConfirmSchedule', error);
      return false;
    }
  }

  public async isCanceledSchedule(integrationId: string, scheduleCode?: string, scheduleId?: number): Promise<boolean> {
    if (!scheduleCode && !scheduleId) {
      return false;
    }

    try {
      const where: FindOptionsWhere<Schedules>[] = [];

      if (scheduleCode) {
        where.push({
          integrationId: castObjectIdToString(integrationId),
          scheduleCode,
          canceledAt: Not(IsNull()),
        });
      } else if (scheduleId) {
        where.push({
          integrationId: castObjectIdToString(integrationId),
          id: scheduleId,
          canceledAt: Not(IsNull()),
        });
      }

      const result = await this.schedulesRepository.count({
        where,
      });

      return result > 0;
    } catch (error) {
      console.error(error);
      this.logger.error('SchedulesService.isCanceledSchedule', error);
      throw error;
    }
  }

  public async isConfirmedSchedule(integrationId: string, scheduleCode: string, scheduleId?: number): Promise<boolean> {
    if (!scheduleCode && !scheduleId) {
      return false;
    }

    try {
      const where: FindOptionsWhere<Schedules>[] = [];

      if (scheduleCode) {
        where.push({
          integrationId: castObjectIdToString(integrationId),
          scheduleCode,
          confirmedAt: Not(IsNull()),
        });
      } else if (scheduleId) {
        where.push({
          integrationId: castObjectIdToString(integrationId),
          id: scheduleId,
          confirmedAt: Not(IsNull()),
        });
      }

      const result = await this.schedulesRepository.count({
        where,
      });

      return result > 0;
    } catch (error) {
      console.error(error);
      this.logger.error('SchedulesService.isConfirmedSchedule', error);
      throw error;
    }
  }

  public async checkCanCancelScheduleAndReturn(
    integrationId: string,
    scheduleCode?: string,
    scheduleId?: number,
  ): Promise<Schedules> {
    const alreadyCanceled = await this.isCanceledSchedule(integrationId, scheduleCode, scheduleId);
    const schedule = await this.getScheduleByCodeOrId(integrationId, scheduleCode, scheduleId);

    if (alreadyCanceled) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.CONFLICT,
        {
          message: 'O agendamento já está cancelado',
          canceledAt: schedule.canceledAt,
        },
        undefined,
        true,
      );
    }

    return schedule;
  }

  public async checkCanConfirmScheduleAndReturn(
    integrationId: string,
    scheduleCode?: string,
    scheduleId?: number,
  ): Promise<Schedules> {
    const alreadyCanceled = await this.isCanceledSchedule(integrationId, scheduleCode, scheduleId);
    const schedule = await this.getScheduleByCodeOrId(integrationId, scheduleCode, scheduleId);

    if (alreadyCanceled) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.CONFLICT,
        {
          message: 'O agendamento foi cancelado',
          canceledAt: schedule.canceledAt,
        },
        undefined,
        true,
      );
    }

    const alreadyConfirmed = await this.isConfirmedSchedule(integrationId, scheduleCode, scheduleId);

    if (alreadyConfirmed) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.OK,
        {
          message: 'O agendamento já está confirmado',
          confirmedAt: schedule.confirmedAt,
        },
        undefined,
        true,
      );
    }

    return schedule;
  }

  public async validateScheduleData(
    integration: IntegrationDocument,
    scheduleCode: string,
    scheduleId: number,
    getScheduleData: (integration: IntegrationDocument, scheduleCode: string) => Promise<ExtractedSchedule[]>,
  ): Promise<boolean> {
    const query = this.schedulesRepository
      .createQueryBuilder()
      .where('integration_id = :integrationId', { integrationId: castObjectIdToString(integration._id) });

    if (!scheduleCode && !scheduleId) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NO_CONTENT,
        { message: 'Not found schedule, invalid params', source: 'schedules_source' },
        undefined,
        true,
      );
    }

    if (scheduleId) {
      query.andWhere('id = :scheduleId', { scheduleId });
    } else if (scheduleCode) {
      query.andWhere('schedule_code = :scheduleCode', { scheduleCode });
    }

    const result = await query.getOne();

    if (!result) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NO_CONTENT,
        { message: `Not found schedule ${scheduleCode || scheduleId}`, source: 'schedules_source' },
        undefined,
        true,
      );
    }

    const [schedule]: ExtractedSchedule[] = await getScheduleData(integration, result.scheduleCode);

    if (!schedule) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NO_CONTENT,
        { message: `Not found schedule ${scheduleCode || scheduleId}`, source: 'erp' },
        undefined,
        true,
      );
    }

    const scheduleData: Partial<Schedules> = pick(
      this.buildScheduleFromExtractedData(schedule),
      this.fieldsToValidateSchedule,
    );
    const originalSchedule: Partial<Schedules> = pick(result, this.fieldsToValidateSchedule);
    const scheduleDifferences: { [key: string]: { previous: string; current: string } } = {};

    Object.keys(scheduleData).forEach((key) => {
      if (String(originalSchedule[key]) !== String(scheduleData[key])) {
        scheduleDifferences[key] = {
          previous: originalSchedule[key],
          current: scheduleData[key],
        };
      }
    });

    if (Object.keys(scheduleDifferences).length) {
      throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, scheduleDifferences, undefined, true);
    }

    return true;
  }
}
