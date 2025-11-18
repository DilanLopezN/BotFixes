import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CancelScheduleV2,
  ConfirmationScheduleGuidance,
  ConfirmationScheduleGuidanceResponse,
  ConfirmScheduleV2,
  IIntegratorService,
  ListAvailableSchedulesResponse,
  ListSchedulesToConfirmV2,
  MatchFlowsConfirmation,
} from '../../../integrator/interfaces';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { EntityDocument } from '../../../entities/schema';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { Appointment, AppointmentValue, MinifiedAppointments } from '../../../interfaces/appointment.interface';
import { ConfirmationSchedule } from '../../../interfaces/confirmation-schedule.interface';
import { CorrelationFilter } from '../../../interfaces/correlation-filter.interface';
import { EntityTypes } from '../../../interfaces/entity.interface';
import { Patient } from '../../../interfaces/patient.interface';
import { Schedules } from '../../../schedules/entities/schedules.entity';
import { ConfirmOrCancelConfirmation, KayserConfirmationService } from './kayser-confirmation.service';
import { KayserApiService } from './kayser-api.service';
import { HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { FlowAction } from '../../../flow/interfaces/flow.interface';

@Injectable()
export class KayserService implements IIntegratorService {
  constructor(
    private readonly kayserConfirmationService: KayserConfirmationService,
    private readonly kayserApiService: KayserApiService,
  ) {}

  cancelSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `KayserService.${this.cancelSchedule.name}: Not Implemented`);
  }

  confirmSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `KayserService.${this.confirmSchedule.name}: Not Implemented`);
  }

  createSchedule(): Promise<Appointment> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `KayserService.${this.createSchedule.name}: Not Implemented`);
  }

  createPatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `KayserService.${this.createPatient.name}: Not Implemented`);
  }

  extractSingleEntity(): Promise<EntityTypes[]> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      `KayserService.${this.extractSingleEntity.name}: Not Implemented`,
    );
  }

  getAvailableSchedules(): Promise<ListAvailableSchedulesResponse> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      `KayserService.${this.getAvailableSchedules.name}: Not Implemented`,
    );
  }

  getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      `KayserService.${this.getScheduleValue.name}: Not Implemented`,
    );
  }
  getEntityList(): Promise<EntityDocument[]> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `KayserService.${this.getEntityList.name}: Not Implemented`);
  }

  getMinifiedPatientSchedules(): Promise<MinifiedAppointments> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      `KayserService.${this.getMinifiedPatientSchedules.name}: Not Implemented`,
    );
  }

  getMultipleEntitiesByFilter(): Promise<CorrelationFilter> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      `KayserService.${this.getMultipleEntitiesByFilter.name}: Not Implemented`,
    );
  }

  getConfirmationScheduleById?(): Promise<Schedules> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      `KayserService.${this.getConfirmationScheduleById.name}: Not Implemented`,
    );
  }

  getPatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `KayserService.${this.getPatient.name}: Not Implemented`);
  }
  getPatientSchedules(): Promise<Appointment[]> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      `KayserService.${this.getPatientSchedules.name}: Not Implemented`,
    );
  }

  reschedule(): Promise<Appointment> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `KayserService.${this.reschedule.name}: Not Implemented`);
  }

  updatePatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, `KayserService.${this.updatePatient.name}: Not Implemented`);
  }

  public async getStatus(integration: IntegrationDocument): Promise<OkResponse> {
    return this.kayserApiService.status(integration);
  }

  public async confirmationCancelSchedule(
    integration: IntegrationDocument,
    cancelSchedule: CancelScheduleV2,
  ): Promise<OkResponse> {
    return this.kayserConfirmationService.confirmOrCancelSchedule(
      ConfirmOrCancelConfirmation.cancel,
      integration,
      cancelSchedule,
    );
  }

  public async confirmationConfirmSchedule(
    integration: IntegrationDocument,
    confirmSchedule: ConfirmScheduleV2,
  ): Promise<OkResponse> {
    return this.kayserConfirmationService.confirmOrCancelSchedule(
      ConfirmOrCancelConfirmation.confirm,
      integration,
      confirmSchedule,
    );
  }

  async listSchedulesToConfirm(
    integration: IntegrationDocument,
    data: ListSchedulesToConfirmV2,
  ): Promise<ConfirmationSchedule> {
    return this.kayserConfirmationService.listSchedulesToConfirm(integration, data);
  }

  async matchFlowsConfirmation(integration: IntegrationDocument, data: MatchFlowsConfirmation): Promise<FlowAction[]> {
    return this.kayserConfirmationService.matchFlowsConfirmation(integration, data);
  }

  public async getConfirmationScheduleGuidance(
    integration: IntegrationDocument,
    data: ConfirmationScheduleGuidance,
  ): Promise<ConfirmationScheduleGuidanceResponse> {
    return await this.kayserConfirmationService.getConfirmationScheduleGuidance(integration, data);
  }
}
