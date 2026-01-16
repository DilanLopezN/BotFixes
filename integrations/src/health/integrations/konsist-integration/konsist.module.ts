import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { CacheModule } from '../../../core/cache/cache.module';

import { AppointmentModule } from 'health/analytics/appointment/appointment.module';
import { KonsistApiService } from './services/konsist-api.service';
import { KonsistEntitiesService } from './services/konsist-entities.service';
import { KonsistHelpersService } from './services/konsist-helpers.service';
import { KonsistService } from './services/konsist.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    CacheModule,
    CredentialsModule,
    AppointmentModule,
  ],
  providers: [KonsistApiService, KonsistEntitiesService, KonsistHelpersService, KonsistService],
  exports: [KonsistApiService, KonsistEntitiesService, KonsistHelpersService, KonsistService],
})
export class KonsistModule {}
