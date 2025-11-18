import { Injectable } from '@nestjs/common';
import { BotdesignerApiService } from './botdesigner-api.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  FindDoctorParams,
  FindDoctorResponse,
  ListDoctorSchedulesParams,
  ListDoctorSchedulesResponse,
} from 'kissbot-health-core';

@Injectable()
export class BotdesignerDoctorService {
  constructor(private readonly botdesignerApiService: BotdesignerApiService) {}

  async listDoctorSchedules(
    integration: IntegrationDocument,
    data: ListDoctorSchedulesParams,
  ): Promise<ListDoctorSchedulesResponse[]> {
    return await this.botdesignerApiService.listDoctorSchedules(integration, data);
  }

  async findDoctor(integration: IntegrationDocument, data: FindDoctorParams): Promise<FindDoctorResponse> {
    return await this.botdesignerApiService.findDoctor(integration, data);
  }
}
