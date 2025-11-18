import { Module } from '@nestjs/common';
import { MatrixService } from './services/matrix.service';
import { MatrixHelpersService } from './services/matrix-helpers.service';
import { MatrixApiService } from './services/matrix-api.service';
import { CacheModule } from '../../../core/cache/cache.module';
import { SharedModule } from '../../shared/shared.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { FlowModule } from '../../flow/flow.module';
import { EntitiesModule } from '../../entities/entities.module';
import { HttpModule } from '@nestjs/axios';
import { MatrixEntitiesService } from './services/matrix-entities.service';
import { ExternalInsurancesModule } from '../../external-insurances/external-insurances.module';
import { MatrixDownloadService } from './services/matrix-download.service';
import { AuditModule } from '../../audit/audit.module';
import { MatrixRecoverPasswordService } from './services/matrix-recover-password.service';
import { MatrixConfirmationService } from './services/matrix-confirmation.service';
import { CredentialsModule } from '../../credentials/credentials.module';
import { SchedulingModule } from 'health/scheduling/scheduling.module';
import { RulesHandlerService } from '../../rules-handler/rules-handler.service';
import { SchedulesModule } from '../../schedules/schedules.module';
import { MatrixListSchedulesCachedService } from './services/matrix-list-schedules-cached.service';
import { IntegrationModule } from '../../integration/integration.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 150_000,
    }),
    EntitiesModule,
    FlowModule,
    IntegrationCacheUtilsModule,
    AuditModule,
    SharedModule,
    CacheModule,
    ExternalInsurancesModule,
    CredentialsModule,
    SchedulingModule,
    SchedulesModule,
    IntegrationModule,
  ],
  providers: [
    MatrixService,
    MatrixHelpersService,
    MatrixApiService,
    MatrixEntitiesService,
    MatrixDownloadService,
    MatrixRecoverPasswordService,
    MatrixConfirmationService,
    RulesHandlerService,
    MatrixListSchedulesCachedService,
  ],
})
export class MatrixModule {}
