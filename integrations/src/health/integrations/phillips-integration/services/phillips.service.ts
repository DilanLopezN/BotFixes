import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { Appointment, AppointmentValue, MinifiedAppointments } from '../../../interfaces/appointment.interface';
import { EntityType, EntityTypes } from '../../../interfaces/entity.interface';
import { EntityDocument } from '../../../entities/schema';
import { CorrelationFilter, CorrelationFilterByKey } from '../../../interfaces/correlation-filter.interface';
import { EntitiesService } from '../../../entities/services/entities.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import {
  CancelScheduleV2,
  ConfirmScheduleV2,
  CreatePatient,
  IIntegratorService,
  ListAvailableSchedulesResponse,
  ListSchedulesToConfirmV2,
  PatientFilters,
  PatientSchedules,
  ValidateScheduleConfirmation,
} from '../../../integrator/interfaces';

import { PhillipsApiService } from './phillips-api.service';
import { PATIENT_CACHE_EXPIRATION } from '../../../integration-cache-utils/cache-expirations';
import { PhillipsHelpersService } from './phillips-helpers.service';

import { AppointmentService, RawAppointment } from '../../../../health/shared/appointment.service';
import moment from 'moment';
import { PhillipsParamsType } from '../interfaces';
import { ConfirmationSchedule } from 'health/interfaces/confirmation-schedule.interface';
import { MatchFlowsConfirmationDto } from 'health/integrator/dto';
import { FlowAction, FlowActionElement } from 'health/flow/interfaces/flow.interface';

import { PhillipsEntitiesService } from './phillips-entities.service';
import { PhillipsConfirmationService } from './phillips-confirmation.service';

@Injectable()
export class PhillipsService implements IIntegratorService {
  private readonly logger = new Logger(PhillipsService.name);

  constructor(
    private readonly apiService: PhillipsApiService,
    private readonly entitiesService: EntitiesService,
    private readonly phillipsEntitiesService: PhillipsEntitiesService,
    private readonly phillipsApiService: PhillipsApiService,
    private readonly phillipsHelpersService: PhillipsHelpersService,
    private readonly appointmentService: AppointmentService,
    private readonly helpersService: PhillipsHelpersService,
    private readonly phillipsConfirmationService: PhillipsConfirmationService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
  ) {}

  // ========== STATUS ==========

  public async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const data = await this.apiService.listInsurances(integration);
      return { ok: !!data?.length };
    } catch (error) {
      this.logger.error('PhillipsService.getStatus', error);
      return { ok: false };
    }
  }

  // ========== PATIENT ==========

  public async getPatient(integration: IntegrationDocument, filters: PatientFilters): Promise<Patient> {
    const { cpf, code, cache } = filters;

    try {
      const patientCache = await this.integrationCacheUtilsService.getPatientFromCache(integration, code, cpf);

      if (patientCache && cache) {
        return patientCache;
      }

      const params: Record<string, string> = {};
      if (cpf) params['taxpayer-id'] = cpf;

      const data = await this.apiService.getPatient(integration, code!, params);

      const patient = this.helpersService.mapNaturalPersonToPatient(data);

      if (patient) {
        await this.integrationCacheUtilsService.setPatientCache(
          integration,
          patient.code!,
          patient.cpf,
          patient,
          PATIENT_CACHE_EXPIRATION.toString(),
        );

        return patient;
      }
      return patient!;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsService.getPatient', error);
    }
  }

  public async createPatient(integration: IntegrationDocument, createPatient: CreatePatient): Promise<Patient> {
    try {
      const { patient } = createPatient;
      const payload = this.helpersService.mapPatientToCreatePayload(patient);
      const result = await this.apiService.createPatient(integration, payload);

      const createdPatient = await this.getPatient(integration, { code: result.code, cpf: patient.cpf });

      await this.integrationCacheUtilsService.setPatientCache(
        integration,
        createdPatient.code!,
        createdPatient.cpf,
        createdPatient,
        PATIENT_CACHE_EXPIRATION.toString(),
      );

      return createdPatient;
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsService.createPatient', error);
    }
  }

  public updatePatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'PhillipsService.updatePatient: Not implemented',
      undefined,
      true,
    );
  }

  // ========== ENTITY METHODS ==========

  public async extractSingleEntity(
    integration: IntegrationDocument,
    entityType: EntityType,
    rawFilter?: CorrelationFilter,
    cache?: boolean,
  ): Promise<EntityTypes[]> {
    return await this.phillipsEntitiesService.extractEntity(integration, entityType, rawFilter, cache);
  }

  public async getEntityList(
    integration: IntegrationDocument,
    rawFilter: CorrelationFilter,
    targetEntity: EntityType,
    cache?: boolean,
  ): Promise<EntityDocument[]> {
    return await this.phillipsEntitiesService.listValidApiEntities(integration, rawFilter, targetEntity, cache);
  }

  public async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  // // ========== CONFIRMATION ==========

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return await this.phillipsConfirmationService.listSchedulesToConfirm(integration, data);
  }

  public async matchFlowsConfirmation(
    integration: IntegrationDocument,
    data: MatchFlowsConfirmationDto,
  ): Promise<FlowAction<FlowActionElement>[]> {
    return await this.phillipsConfirmationService.matchFlowsConfirmation(integration, data);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return await this.phillipsConfirmationService.cancelSchedule(integration, cancelSchedule);
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return await this.phillipsConfirmationService.confirmSchedule(integration, confirmSchedule);
  }

  public async validateScheduleData(
    integration: IntegrationDocument,
    data: ValidateScheduleConfirmation,
  ): Promise<OkResponse> {
    try {
      return await this.phillipsConfirmationService.validateScheduleData(integration, data);
    } catch (error) {
      console.error(error);
      throw INTERNAL_ERROR_THROWER('PhillipsService.validateScheduleData', error);
    }
  }

  // public async matchFlowsConfirmation(
  //   integration: IntegrationDocument,
  //   data: MatchFlowsConfirmation,
  // ): Promise<FlowAction<FlowActionElement>[]> {
  //   return await this.confirmationService.matchFlowsConfirmation(integration, data);
  // }

  // public async listSchedulesToConfirm(
  //   integration: IntegrationDocument,
  //   data: ListSchedulesToConfirmV2,
  // ): Promise<ConfirmationSchedule> {
  //   return await this.confirmationService.listSchedulesToConfirm(integration, data);
  // }

  // public async confirmationCancelSchedule(
  //   integration: IntegrationDocument,
  //   cancelSchedule: CancelScheduleV2,
  // ): Promise<OkResponse> {
  //   return await this.confirmationService.cancelSchedule(integration, cancelSchedule);
  // }

  // public async confirmationConfirmSchedule(
  //   integration: IntegrationDocument,
  //   confirmSchedule: ConfirmScheduleV2,
  // ): Promise<OkResponse> {
  //   return await this.confirmationService.confirmSchedule(integration, confirmSchedule);
  // }

  // public async getConfirmationScheduleGuidance(
  //   integration: IntegrationDocument,
  //   data: ConfirmationScheduleGuidance,
  // ): Promise<ConfirmationScheduleGuidanceResponse> {
  //   return await this.confirmationService.getScheduleGuidance(integration, data);
  // }

  // public async validateScheduleData(
  //   integration: IntegrationDocument,
  //   data: ValidateScheduleConfirmation,
  // ): Promise<OkResponse> {
  //   return await this.confirmationService.validateScheduleData(integration, data);
  // }

  // public async getConfirmationScheduleById(
  //   integration: IntegrationDocument,
  //   data: GetScheduleByIdData,
  // ): Promise<Schedules> {
  //   return await this.confirmationService.getConfirmationScheduleById(integration, data);
  // }

  // ========== NOT IMPLEMENTED ==========

  public cancelSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'PhillipsService.cancelSchedule: Not implemented',
      undefined,
      true,
    );
  }

  public confirmSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'PhillipsService.confirmSchedule: Not implemented',
      undefined,
      true,
    );
  }

  public createSchedule(): Promise<Appointment> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'PhillipsService.createSchedule: Not implemented',
      undefined,
      true,
    );
  }

  public getAvailableSchedules(): Promise<ListAvailableSchedulesResponse> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'PhillipsService.getAvailableSchedules: Not implemented',
      undefined,
      true,
    );
  }

  public getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'PhillipsService.getScheduleValue: Not implemented',
      undefined,
      true,
    );
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientSchedules: PatientSchedules,
  ): Promise<Appointment[]> {
    const { patientCode, startDate, endDate } = patientSchedules;

    const initialDate = startDate
      ? moment(startDate).format('YYYY-MM-DD')
      : moment().subtract(1, 'year').format('YYYY-MM-DD');

    const finalDate = endDate ? moment(endDate).format('YYYY-MM-DD') : moment().add(1, 'year').format('YYYY-MM-DD');

    const consultationParams: PhillipsParamsType = {
      naturalPersonCode: patientCode,
      initialDate,
      endDate: finalDate,
      page: 1,
      maxResults: 100,
    };

    const examsParams: PhillipsParamsType = {
      naturalPersonCode: patientCode,
      initialDate,
      endDate: finalDate,
      page: 1,
      maxResults: 100,
    };

    try {
      const [consultationsResponse, examsResponse] = await Promise.all([
        this.phillipsApiService
          .listSchedulesConsultation(integration, consultationParams)
          .catch(() => ({ results: [] })),
        this.phillipsApiService.listExamsSchedule(integration, examsParams).catch(() => ({ results: [] })),
      ]);

      const consultationSchedules = consultationsResponse?.results ?? [];
      const examSchedules = examsResponse?.results ?? [];

      if (!consultationSchedules.length && !examSchedules.length) {
        return [];
      }

      const rawConsultations: RawAppointment[] = consultationSchedules.map((schedule) =>
        this.phillipsHelpersService.createPatientAppointmentObject(schedule),
      );

      const rawExams: RawAppointment[] = examSchedules.map((schedule) =>
        this.phillipsHelpersService.createPatientExamAppointmentObject(schedule),
      );

      return await this.appointmentService.transformSchedules(integration, [...rawConsultations, ...rawExams]);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('PhillipsService.getPatientSchedules', error);
    }
  }

  public getMinifiedPatientSchedules(): Promise<MinifiedAppointments> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'PhillipsService.getMinifiedPatientSchedules: Not implemented',
      undefined,
      true,
    );
  }

  public reschedule(): Promise<Appointment> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'PhillipsService.reschedule: Not implemented',
      undefined,
      true,
    );
  }
}
