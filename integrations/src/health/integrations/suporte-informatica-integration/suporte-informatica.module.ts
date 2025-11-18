import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '../../../core/cache/cache.module';
import { ApiModule } from '../../api/api.module';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { SuporteInformaticaApiService } from './services/suporte-informatica-api.service';
import { SuporteInformaticaEntitiesService } from './services/suporte-informatica-entities.service';
import { SuporteInformaticaExtractorService } from './services/suporte-informatica-extractor.service';
import { SuporteInformaticaHelpersService } from './services/suporte-informatica-helpers.service';
import { SuporteInformaticaService } from './services/suporte-informatica.service';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';

@Module({
  imports: [
    // @docs: https://www.agendeumaconsulta.com.br/webapi/doc/index
    HttpModule.register({
      timeout: 90_000,
    }),
    CacheModule,
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    ApiModule,
    SharedModule,
    AuditModule,
    CredentialsModule,
  ],
  providers: [
    SuporteInformaticaApiService,
    SuporteInformaticaHelpersService,
    SuporteInformaticaEntitiesService,
    SuporteInformaticaService,
    SuporteInformaticaExtractorService,
  ],
})
export class SuporteInformaticaModule {}
