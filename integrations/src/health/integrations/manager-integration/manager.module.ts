import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { ManagerApiService } from './services/manager-api.service';
import { ManagerEntitiesService } from './services/manager-entities.service';
import { ManagerHelpersService } from './services/manager-helpers.service';
import { ManagerService } from './services/manager.service';
import { CacheModule } from '../../../core/cache/cache.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 100_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    AuditModule,
    SharedModule,
    CacheModule,
    CredentialsModule,
  ],
  providers: [ManagerService, ManagerApiService, ManagerHelpersService, ManagerEntitiesService],
})
export class ManagerModule {}
