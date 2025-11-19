import { Module } from '@nestjs/common';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { CacheModule } from '../../../core/cache/cache.module';
import { ProdoctorIntegrationService } from './services/prodoctor-integration.service';

@Module({
  imports: [
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    CacheModule,
    CredentialsModule,
  ],
  providers: [ProdoctorIntegrationService],
})
export class ProdoctorIntegrationModule {}
