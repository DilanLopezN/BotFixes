import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { CacheModule } from '../../../core/cache/cache.module';
import { SharedModule } from '../../shared/shared.module';
import { ClinicService } from './services/clinic.service';
import { ClinicHelpersService } from './services/clinic-helpers.service';
import { ClinicApiService } from './services/clinic-api.service';
import { ClinicEntitiesService } from './services/clinic-entities.service';
import { ClinicConfirmationService } from './services/clinic-confirmation.service';
import { SchedulesModule } from '../../schedules/schedules.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';

@Module({
  imports: [
    // @docs: https://documenter.getpostman.com/view/12008590/UVXbseHs#a12ecc6d-3133-4e9f-a3e5-854efe7dff8a
    HttpModule.register({
      timeout: 75_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    CacheModule,
    SharedModule,
    AuditModule,
    SchedulesModule,
    CredentialsModule,
  ],
  providers: [ClinicService, ClinicHelpersService, ClinicApiService, ClinicEntitiesService, ClinicConfirmationService],
})
export class ClinicModule {}
