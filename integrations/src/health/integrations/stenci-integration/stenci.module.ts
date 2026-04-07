import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationModule } from '../../integration/integration.module';
import { SharedModule } from '../../shared/shared.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { StenciApiService } from './services/stenci-api.service';
import { StenciService } from './services/stenci.service';
import { StenciEntitiesService } from './services/stenci-entities.service';
import { StenciHelpersService } from './services/stenci-helpers.service';
import { StenciConfirmationService } from './services/stenci-confirmation.service';
import { SchedulesModule } from '../../schedules/schedules.module';

@Module({
  imports: [
    // @docs: https://api-gtw.stenci.app
    HttpModule.register({
      timeout: 120_000,
      baseURL: 'https://api-gtw.stenci.app',
    }),
    EntitiesModule,
    IntegrationModule,
    FlowModule,
    SharedModule,
    AuditModule,
    CredentialsModule,
    IntegrationCacheUtilsModule,
    SchedulesModule,
  ],
  providers: [StenciService, StenciApiService, StenciEntitiesService, StenciHelpersService, StenciConfirmationService],
  exports: [StenciService],
})
export class StenciModule {}
