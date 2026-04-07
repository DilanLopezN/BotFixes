import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { SchedulesModule } from '../../schedules/schedules.module';
import { PhillipsApiService } from './services/phillips-api.service';
import { PhillipsService } from './services/phillips.service';

@Module({
  imports: [
    // @docs: Phillips/Philips Tasy HISS - URL definitiva pendente
    HttpModule.register({
      timeout: 120_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    SchedulesModule,
    CredentialsModule,
  ],
  providers: [
    PhillipsService,
    PhillipsApiService,
    //PhillipsEntitiesService,
    //PhillipsHelpersService,
    // PhillipsConfirmationService - TODO,
  ],

  exports: [PhillipsService],
})
export class PhillipsModule {}
