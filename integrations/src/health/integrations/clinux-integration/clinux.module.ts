import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '../../../core/cache/cache.module';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { ClinuxHelpersService } from './services/clinux-helpers.service';
import { ClinuxService } from './services/clinux.service';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { ClinuxConfirmationService } from './services/clinux-confirmation.service';
import { SchedulesModule } from '../../schedules/schedules.module';
import { SchedulingModule } from '../../scheduling/scheduling.module';
import { ClinuxApiService } from './services/clinux-api.service';
import { ClinuxApiV2Service } from './services/clinux-api-v2.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 45_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    CacheModule,
    SharedModule,
    AuditModule,
    CredentialsModule,
    SchedulesModule,
    SchedulingModule,
  ],
  providers: [ClinuxService, ClinuxHelpersService, ClinuxConfirmationService, ClinuxApiService, ClinuxApiV2Service],
})
export class ClinuxModule {}
