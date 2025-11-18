import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '../../../core/cache/cache.module';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { SaoMarcosApiService } from './services/sao-marcos-api.service';
import { SaoMarcosHelpersService } from './services/sao-marcos-helpers.service';
import { SaoMarcosService } from './services/sao-marcos.service';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { SaoMarcosConfirmationService } from './services/sao-marcos-confirmation.service';
import { SchedulesModule } from '../../schedules/schedules.module';

@Module({
  imports: [
    // @docs: https://chatbot.saomarcos.org.br/v1/documentation/swagger-ui/index.html#/
    HttpModule.register({
      timeout: 60_000,
      baseURL: 'https://chatbot.saomarcos.org.br/v1',
    }),
    CacheModule,
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    CredentialsModule,
    SchedulesModule,
  ],
  providers: [SaoMarcosApiService, SaoMarcosHelpersService, SaoMarcosService, SaoMarcosConfirmationService],
})
export class SaoMarcosModule {}
