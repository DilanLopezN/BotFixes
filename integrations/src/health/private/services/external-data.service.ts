import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IntegrationService } from '../../integration/integration.service';

@Injectable()
export class ExternalDataService {
  private integrationService: IntegrationService;
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationBootstrap() {
    this.integrationService = this.moduleRef.get<IntegrationService>(IntegrationService, {
      strict: false,
    });
  }

  async getIntegrationById(integrationId: string) {
    return await this.integrationService.getOne(integrationId);
  }
}
