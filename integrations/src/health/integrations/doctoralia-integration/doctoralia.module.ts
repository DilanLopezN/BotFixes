import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EntitiesModule } from '../../entities/entities.module';
import { DoctoraliaService } from './services/doctoralia.service';
import { DoctoraliaApiService } from './services/doctoralia-api.service';
import { DoctoraliaHelpersService } from './services/doctoralia-helpers.service';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { RulesHandlerService } from '../../rules-handler/rules-handler.service';
import { CacheModule } from '../../../core/cache/cache.module';

@Module({
  imports: [
    // @docs: https://apidoc.tuotempo.com/
    HttpModule.register({
      timeout: 70_000,
      baseURL: 'https://app.tuotempo.com/api/v3',
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    CacheModule,
    CredentialsModule,
  ],
  providers: [RulesHandlerService, DoctoraliaService, DoctoraliaApiService, DoctoraliaHelpersService],
})
export class DoctoraliaModule {}
