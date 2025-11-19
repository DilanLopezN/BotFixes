import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { CacheModule } from '../../../core/cache/cache.module';

import { ProdoctorApiService } from './services/prodoctor-api.service';
import { ProdoctorHelpersService } from './services/prodoctor-helpers.service';
// import { ProdoctorEntitiesService } from './services/prodoctor-entities.service';
// import { ProdoctorService } from './services/prodoctor.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 150_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    CacheModule,
    CredentialsModule,
  ],
  // providers: [ProdoctorService, ProdoctorApiService, ProdoctorHelpersService, ProdoctorEntitiesService],
})
export class ProdoctorIntegrationModule {}
