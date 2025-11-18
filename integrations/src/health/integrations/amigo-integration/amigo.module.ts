import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CacheModule } from '../../../core/cache/cache.module';
import { AuditModule } from '../../audit/audit.module';
import { EntitiesModule } from '../../entities/entities.module';
import { EventsModule } from '../../events/events.module';
import { ExternalInsurancesModule } from '../../external-insurances/external-insurances.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { AmigoApiService } from './services/amigo-api.service';
import { AmigoEntitiesService } from './services/amigo-entities.service';
import { AmigoHelpersService } from './services/amigo-helpers.service';
import { AmigoService } from './services/amigo.service';
import { CredentialsModule } from '../../credentials/credentials.module';
import { AmigoConfirmationService } from './services/amigo-confirmation.service';
import { SchedulesModule } from '../../schedules/schedules.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 150_000,
      baseURL: 'https://api.amigocare.com.br/api-chatbot',
    }),
    FlowModule,
    CacheModule,
    SharedModule,
    EventsModule,
    EntitiesModule,
    AuditModule,
    ExternalInsurancesModule,
    IntegrationCacheUtilsModule,
    CredentialsModule,
    SchedulesModule,
  ],
  providers: [AmigoService, AmigoApiService, AmigoEntitiesService, AmigoConfirmationService, AmigoHelpersService],
})
export class AmigoModule {}
