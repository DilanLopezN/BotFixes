import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EntitiesModule } from '../../entities/entities.module';
import { CmApiService } from './services/cm-api.service';
import { CmService } from './services/cm.service';
import { IntegrationModule } from '../../integration/integration.module';
import { FlowModule } from '../../flow/flow.module';
import { ExternalInsurancesModule } from '../../external-insurances/external-insurances.module';
import { CmHelpersService } from './services/cm-helpers.service';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { CacheModule } from '../../../core/cache/cache.module';
import { SharedModule } from '../../shared/shared.module';
import { CmRulesHandlerService } from './services/cm-rules-handler.service';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { RulesHandlerService } from '../../rules-handler/rules-handler.service';

@Module({
  imports: [
    // @docs: https://api.nuria.com.br/docs/index.html
    HttpModule.register({
      timeout: 60_000,
    }),
    EntitiesModule,
    IntegrationModule,
    FlowModule,
    ExternalInsurancesModule,
    CacheModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    CredentialsModule,
  ],
  providers: [RulesHandlerService, CmApiService, CmService, CmHelpersService, CmRulesHandlerService],
  exports: [CmRulesHandlerService],
})
export class CmModule {}
