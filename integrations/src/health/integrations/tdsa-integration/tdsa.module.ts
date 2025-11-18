import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { TdsaApiService } from './services/tdsa-api.service';
import { TdsaHelpersService } from './services/tdsa-helpers.service';
import { TdsaService } from './services/tdsa.service';
import { TdsaConfirmationService } from './services/tdsa-confirmation.service';
import { SchedulesModule } from '../../schedules/schedules.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';

@Module({
  imports: [
    // @docs: http://rc.tdsasistemas.com.br/RcDemonstracao/documentacao/indexv2.html
    HttpModule.register({
      timeout: 60_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    AuditModule,
    SharedModule,
    SchedulesModule,
    CredentialsModule,
  ],
  providers: [TdsaService, TdsaApiService, TdsaHelpersService, TdsaConfirmationService],
})
export class TdsaModule {}
