import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EntitiesModule } from '../../entities/entities.module';
import { NetpacsApiService } from './services/netpacs-api.service';
import { NetpacsService } from './services/netpacs.service';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SharedModule } from '../../shared/shared.module';
import { NetpacsConfirmationService } from './services/netpacs-confirmation.service';
import { NetpacsServiceHelpersService } from './services/netpacs-helpers.service';
import { SchedulesModule } from '../../schedules/schedules.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 45_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    AuditModule,
    SchedulesModule,
    CredentialsModule,
  ],
  providers: [NetpacsService, NetpacsApiService, NetpacsConfirmationService, NetpacsServiceHelpersService],
})
export class NetpacsModule {}
