import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DrMobileService } from './services/dr-mobile.service';
import { DrMobileApiService } from './services/dr-mobile-api.service';
import { DrMobileHelpersService } from './services/dr-mobile-helpers.service';
import { EntitiesModule } from '../../entities/entities.module';
import { IntegrationModule } from '../../integration/integration.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { DrMobileEntitiesService } from './services/dr-mobile-entities.service';
import { DrMobileConfirmationService } from './services/dr-mobile-confirmation.service';
import { SchedulesModule } from '../../schedules/schedules.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';

@Module({
  imports: [
    // @docs: https://app.swaggerhub.com/apis-docs/drmobile/api
    HttpModule.register({
      timeout: 120_000,
      baseURL: 'https://api.drmobile.com.br:9443',
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
  providers: [
    DrMobileService,
    DrMobileApiService,
    DrMobileEntitiesService,
    DrMobileHelpersService,
    DrMobileConfirmationService,
  ],
})
export class DrMobileModule {}
