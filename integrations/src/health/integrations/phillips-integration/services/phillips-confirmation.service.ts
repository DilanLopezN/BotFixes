import { Injectable } from '@nestjs/common';
import { FlowAction, FlowActionElement, FlowSteps } from '../../../flow/interfaces/flow.interface';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  ExtractType,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
  ValidateScheduleConfirmation,
} from '../../../integrator/interfaces';
import { INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { FlowService } from '../../../flow/service/flow.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { PhillipsApiService } from './phillips-api.service';
import {
  ConfirmationSchedule,
  ConfirmationScheduleDataV2,
  ConfirmationScheduleSchedule,
} from '../../../interfaces/confirmation-schedule.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import * as moment from 'moment';
import { CorrelationFilterByKeys } from '../../../interfaces/correlation-filter.interface';
import { EntityDocument } from '../../../entities/schema';
import { PhillipsHelpersService } from './phillips-helpers.service';
import { EntitiesService } from '../../../entities/services/entities.service';
import { SchedulesService } from '../../../schedules/schedules.service';
import { ExtractedSchedule } from '../../../schedules/interfaces/extracted-schedule.interface';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { GetScheduleByIdData } from '../../../integrator/interfaces/get-schedule-by-id.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { PhillipsConfirmationErpParams } from '../interfaces/confirmation';
import { PhillipsConsultationSchedule, PhillipsListSchedulesParams } from '../interfaces';

@Injectable()
export class PhillipsConfirmationService {
  constructor(
    private readonly phillipsApiService: PhillipsApiService,
    private readonly phillipsHelpersService: PhillipsHelpersService,
    private readonly entitiesService: EntitiesService,
    private readonly flowService: FlowService,
    private readonly schedulesService: SchedulesService,
  ) {}

  private async listSchedulesToConfirmData(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<PhillipsConfirmationErpParams>,
  ): Promise<ExtractedSchedule[]> {
    const { startDate, endDate } = data;

    const maxResults = 100;

    const requestFilters: PhillipsListSchedulesParams = {
      page: 1,
      maxResults,
      initialDate: moment(startDate).format('YYYY-MM-DD'),
      endDate: moment(endDate).format('YYYY-MM-DD'),
    };

    const schedules: PhillipsConsultationSchedule[] = [];
    let response: PhillipsConsultationSchedule[];
    let page = 1;

    do {
      const result = await this.phillipsApiService.listSchedules(integration, {
        ...requestFilters,
        page,
      });

      response = result?.results ?? [];

      if (response?.length > 0) {
        response.forEach((schedule) => {
          const scheduleDate = schedule.consultationScheduleEmbeddedDate?.scheduleDate;

          if (
            moment(scheduleDate).valueOf() >= moment(startDate).valueOf() &&
            moment(scheduleDate).valueOf() <= moment(endDate).valueOf()
          ) {
            schedules.push(schedule);
          }
        });
      }
      page++;
    } while (response?.length >= maxResults);

    return this.transformPhillipsSchedulesToExtractedSchedules(integration, schedules);
  }

  private transformPhillipsSchedulesToExtractedSchedules(
    _integration: IntegrationDocument,
    schedules: PhillipsConsultationSchedule[],
  ): ExtractedSchedule[] {
    return schedules?.map((schedule) => {
      const doctorCode = schedule.scheduleCode?.professional?.naturalPersonCode
        ? String(schedule.scheduleCode.professional.naturalPersonCode)
        : undefined;

      const specialityCode = schedule.scheduleCode?.specialty?.code
        ? String(schedule.scheduleCode.specialty.code)
        : undefined;

      // Na resposta da Phillips, o insurance vem dentro de scheduleCode ou no root — ajustar conforme interface real
      const insuranceCode = (schedule as any)?.insurance?.insuranceCode
        ? String((schedule as any).insurance.insuranceCode)
        : undefined;

      const organizationUnitCode = schedule.scheduleCode?.establishmentCode?.id
        ? String(schedule.scheduleCode.establishmentCode.id)
        : undefined;

      const patientPhones: string[] = [];
      if (schedule.phoneNumber) {
        // phoneNumber vem no formato "M: (54)992098412 " — extrair apenas números
        const cleanPhone = schedule.phoneNumber.replace(/[^\d]/g, '');
        if (cleanPhone) {
          patientPhones.push(cleanPhone);
        }
      }
      if (schedule.patient?.phoneNumber) {
        const cleanPhone = String(schedule.patient.phoneNumber).replace(/[^\d]/g, '');
        if (cleanPhone && !patientPhones.includes(cleanPhone)) {
          patientPhones.push(cleanPhone);
        }
      }

      return {
        doctorCode,
        insuranceCode,
        procedureCode: '',
        organizationUnitCode,
        specialityCode,
        appointmentTypeCode: '',
        scheduleCode: String(schedule.sequence),
        scheduleDate: schedule.consultationScheduleEmbeddedDate?.scheduleDate,
        patient: {
          email: schedule.email || null,
          code: schedule.patient?.naturalPersonCode ? String(schedule.patient.naturalPersonCode) : null,
          name: schedule.patientName || schedule.patient?.name || null,
          phones: patientPhones,
          cpf: schedule.patient?.taxPayerId || null,
          bornDate: schedule.patient?.birthDate ? moment(schedule.patient.birthDate).format('YYYY-MM-DD') : null,
        },
      } as ExtractedSchedule;
    });
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2<PhillipsConfirmationErpParams>,
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

    const correlationData: { [entityType: string]: { [entityCode: string]: EntityDocument } } =
      await this.entitiesService.createCorrelationDataKeys(correlationsKeysData, integration._id);

    for await (const schedule of schedules) {
      const scheduleCorrelation: { [entityType: string]: EntityDocument } = {};
      const scheduleMap = this.schedulesService.formatScheduleToEntityMap(schedule);

      Object.keys(scheduleMap).forEach((entityType) => {
        const entityCode = scheduleMap[entityType];
        scheduleCorrelation[entityType] = correlationData[entityType]?.[entityCode];
      });

      const canConfirmActive = Object.values(scheduleCorrelation)
        .filter((entity) => !!entity)
        .every((entity) => entity.canConfirmActive);

      const { organizationUnit, doctor, speciality } = scheduleCorrelation;
      const dateFormat = 'YYYY-MM-DDTHH:mm:ss';

      const scheduleObject: ConfirmationScheduleSchedule = {
        scheduleId: schedule.id,
        scheduleCode: String(schedule.scheduleCode),
        scheduleDate: moment(schedule.scheduleDate).format(dateFormat),
        organizationUnitAddress: (organizationUnit?.data as any)?.address,
        organizationUnitName: organizationUnit?.friendlyName ?? '',
        procedureName: schedule.procedureName?.trim() ?? '',
        doctorName: doctor?.friendlyName || schedule.doctorName?.trim() || '',
        appointmentTypeName: '',
        appointmentTypeCode: '',
        specialityCode: speciality?.code || undefined,
        specialityName: speciality?.friendlyName || '',
        doctorCode: doctor?.code || schedule?.doctorCode,
        organizationUnitCode: organizationUnit?.code || schedule?.organizationUnitCode,
        procedureCode: undefined,
      };

      const confirmationScheduleContactEmails: string[] = [];
      const confirmationSchedule: ConfirmationScheduleDataV2 = {
        contact: {
          phone: [],
          email: confirmationScheduleContactEmails,
          name: schedule.patientName,
          code: schedule.patientCode ?? '',
        },
        schedule: scheduleObject,
        actions: [],
      };

      if (debugPhone) {
        confirmationSchedule.contact.phone.push(String(debugPhone).trim());
      } else {
        const phones = ([] as string[]).concat(schedule.patientPhone1 || [], schedule.patientPhone2 || []);
        phones
          .filter((phone) => !!phone)
          .forEach((phone) => {
            confirmationSchedule.contact.phone.push(String(phone).trim());
          });
      }

      if (schedule.patientEmail1) {
        confirmationScheduleContactEmails.push(schedule.patientEmail1);
      } else if (schedule.patientEmail2) {
        confirmationScheduleContactEmails.push(schedule.patientEmail2);
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
        result.ommitedData?.push(confirmationSchedule);
      }
    }

    if (debugPatientCode) {
      result.data = result.data?.filter((schedule) => debugPatientCode.includes(schedule.contact?.code));
    }

    if (debugScheduleCode) {
      result.data = result.data?.filter((schedule) => {
        if ('schedule' in schedule) {
          const scheduleCode = (schedule as ConfirmationScheduleDataV2).schedule?.scheduleCode;
          return scheduleCode ? debugScheduleCode.includes(scheduleCode) : false;
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
      throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.matchFlowsConfirmation', error);
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: CancelScheduleV2<PhillipsConfirmationErpParams>,
  ): Promise<OkResponse> {
    const schedule = await this.schedulesService.checkCanCancelScheduleAndReturn(
      castObjectIdToString(integration._id),
      scheduleCode,
      scheduleId,
    );

    try {
      await this.phillipsApiService.confirmSchedule(integration, Number(schedule.scheduleCode));

      await this.schedulesService.buildCancelSchedule(integration, schedule.scheduleCode, scheduleId);

      return { ok: true };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.cancelSchedule', error);
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
      await this.phillipsApiService.confirmSchedule(integration, Number(schedule.scheduleCode));
    } catch (error: any) {
      // Trata caso já esteja confirmado/cancelado — similar ao padrão Netpacs
      const isAlreadyConfirmed =
        error?.response?.data?.message?.includes?.('Successfully updated') || error?.response?.status === 400;

      if (!isAlreadyConfirmed) {
        console.error(error);
        throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.confirmSchedule', error);
      }
    }

    await this.schedulesService.buildConfirmSchedule(integration, schedule.scheduleCode, scheduleId!);
    return { ok: true };
  }

  async getSchedule(integration: IntegrationDocument, scheduleCode: string): Promise<ExtractedSchedule[]> {
    const result = await this.phillipsApiService.listSchedules(integration, {
      page: 1,
      maxResults: 100,
      initialDate: moment().subtract(1, 'year').format('YYYY-MM-DD'),
      endDate: moment().add(1, 'month').format('YYYY-MM-DD'),
    });

    const schedule = result?.results?.find((s) => String(s.sequence) === scheduleCode);

    if (!schedule) {
      return [];
    }

    return this.transformPhillipsSchedulesToExtractedSchedules(integration, [schedule]);
  }

  public async validateScheduleData(
    integration: IntegrationDocument,
    { scheduleCode, scheduleId }: ValidateScheduleConfirmation,
  ): Promise<OkResponse> {
    try {
      const result = await this.schedulesService.validateScheduleData(
        integration,
        scheduleCode ?? '',
        scheduleId!,
        this.getSchedule.bind(this),
      );

      return { ok: result };
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.validateScheduleData', error);
    }
  }

  async getConfirmationScheduleById(integration: IntegrationDocument, data: GetScheduleByIdData): Promise<Schedules> {
    try {
      return await this.schedulesService.getScheduleByCodeOrId(
        castObjectIdToString(integration._id),
        undefined,
        data.scheduleId,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsConfirmationService.getConfirmationScheduleById', error);
    }
  }
}
