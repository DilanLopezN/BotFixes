import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationModule } from '../../integration/integration.module';
import { FeegowApiService } from './services/feegow-api.service';
import { FeegowService } from './services/feegow.service';
import { FeegowHelpersService } from './services/feegow-helpers.service';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { FeegowConfirmationService } from './services/feegow-confirmation.service';
import { SchedulesModule } from '../../schedules/schedules.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';

@Module({
  imports: [
    // @docs: https://docs.feegow.com/?version=1.0
    HttpModule.register({
      timeout: 45_000,
      baseURL: 'https://api.feegow.com/v1/api',
    }),
    EntitiesModule,
    IntegrationModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    SchedulesModule,
    CredentialsModule,
  ],
  providers: [FeegowService, FeegowApiService, FeegowHelpersService, FeegowConfirmationService],
})
export class FeegowModule {}
