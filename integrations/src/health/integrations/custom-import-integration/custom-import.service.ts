import { HttpStatus, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { HTTP_ERROR_THROWER } from '../../../common/exceptions.service';
import { normalize } from '../../../common/helpers/normalize-text.helper';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { EntityDocument } from '../../entities/schema';
import { EntitiesService } from '../../entities/services/entities.service';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { IIntegratorService } from '../../integrator/interfaces/integrator-service.interface';
import {
  Appointment,
  AppointmentValue,
  FollowUpAppointment,
  MinifiedAppointments,
} from '../../interfaces/appointment.interface';
import { CorrelationFilter, CorrelationFilterByKey } from '../../interfaces/correlation-filter.interface';
import { EntityListByText } from '../../interfaces/entity-list-text.interface';
import { EntityType, EntityTypes } from '../../interfaces/entity.interface';
import { Patient } from '../../interfaces/patient.interface';
import { ListAvailableSchedulesResponse } from '../../integrator/interfaces';
import { FlowService } from '../../flow/service/flow.service';

@Injectable()
export class CustomImportService implements IIntegratorService {
  constructor(
    private readonly entitiesService: EntitiesService,
    private flowService: FlowService,
  ) {}

  async cancelSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.cancelSchedule: Not implemented',
      undefined,
      true,
    );
  }

  async confirmSchedule(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.confirmSchedule: Not implemented',
      undefined,
      true,
    );
  }

  async createSchedule(): Promise<Appointment> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.createSchedule: Not implemented',
      undefined,
      true,
    );
  }

  async createPatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.createPatient: Not implemented',
      undefined,
      true,
    );
  }

  extract(): Promise<OkResponse> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.extract: Not implemented',
      undefined,
      true,
    );
  }

  async extractSingleEntity(): Promise<EntityTypes[]> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.extractSingleEntity: Not implemented',
      undefined,
      true,
    );
  }

  async getAvailableSchedules(): Promise<ListAvailableSchedulesResponse> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.getAvailableSchedules: Not implemented',
      undefined,
      true,
    );
  }

  public async getScheduleValue(): Promise<AppointmentValue> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.extract: Not implemented',
      undefined,
      true,
    );
  }

  public async getEntityList(
    integration: IntegrationDocument,
    filter: CorrelationFilter,
    targetEntity: EntityType,
  ): Promise<EntityDocument[]> {
    const flows = await this.flowService.getFlowsByCorrelation(integration._id, filter, targetEntity);
    const validIds = flows.flatMap((flow) => flow[`${targetEntity}Id`]);

    return await this.entitiesService.getEntitiesByIds(integration._id, targetEntity, validIds);
  }

  public async extractEntity(): Promise<EntityTypes[]> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'CustomImportService.extractEntity: Not implemented');
  }

  async getEntityListByText(
    integration: IntegrationDocument,
    filter: CorrelationFilter,
    targetEntity: EntityType,
    text: string,
  ): Promise<EntityListByText> {
    const normalizedText = normalize(text, false);

    const response: EntityListByText = {
      isValid: false,
      data: [],
    };

    const ids: Types.ObjectId[] = [];
    const flows = await this.flowService.getFlowsByCorrelation(integration._id, filter, targetEntity);
    const validIds = flows.flatMap((flow) => flow[`${targetEntity}Id`]);
    ids.push(...validIds);

    const entities = await this.entitiesService.getEntitiesByTargetAndName(
      integration._id,
      targetEntity,
      [normalizedText],
      Array.from(new Set(ids)),
    );

    if (entities?.length) {
      response.data = entities;
      response.isValid = true;
      return response;
    }

    return response;
  }

  async getMinifiedPatientSchedules(): Promise<MinifiedAppointments> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.getMinifiedPatientSchedules: Not implemented',
    );
  }

  async getMultipleEntitiesByFilter(
    integration: IntegrationDocument,
    filter: CorrelationFilterByKey,
  ): Promise<CorrelationFilter> {
    return await this.entitiesService.createCorrelationFilterData(filter, 'code', integration._id);
  }

  async getPatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.getPatient: Not implemented',
      undefined,
      true,
    );
  }

  async getPatientSchedules(): Promise<Appointment[]> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.getPatientSchedules: Not implemented',
      undefined,
      true,
    );
  }

  async getStatus(): Promise<OkResponse> {
    return { ok: true };
  }

  async reschedule(): Promise<Appointment> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.reschedule: Not implemented',
      undefined,
      true,
    );
  }

  public async updatePatient(): Promise<Patient> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.updatePatient: Not implemented',
      undefined,
      true,
    );
  }

  getPatientFollowUpSchedules(): Promise<FollowUpAppointment[]> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'CustomImportService.getPatientFollowUpSchedules: Not implemented',
      undefined,
      true,
    );
  }
}
