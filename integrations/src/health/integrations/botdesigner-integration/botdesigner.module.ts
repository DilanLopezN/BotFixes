import { Module } from '@nestjs/common';
import { CacheModule } from '../../../core/cache/cache.module';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SchedulesModule } from '../../schedules/schedules.module';
import { SharedModule } from '../../shared/shared.module';
import { BotdesignerEntitiesService } from './services/botdesigner-entities.service';
import { BotdesignerService } from './services/botdesigner.service';
import { BotdesignerHelpersService } from './services/botdesigner-helpers.service';
import { BotdesignerConfirmationService } from './services/botdesigner-confirmation.service';
import { BotdesignerApiService } from './services/botdesigner-api.service';
import { HttpModule } from '@nestjs/axios';
import { BotdesignerDoctorService } from './services/botdesigner-doctor.service';
import { AppointmentModule } from '../../analytics/appointment/appointment.module';
import { AuditModule } from '../../audit/audit.module';
import { CredentialsModule } from '../../credentials/credentials.module';
import { IntegrationModule } from '../../integration/integration.module';
import { ApiModule } from '../../api/api.module';
import { SchedulingModule } from '../../scheduling/scheduling.module';

@Module({
  imports: [
    EntitiesModule,
    IntegrationCacheUtilsModule,
    CacheModule,
    SharedModule,
    AuditModule,
    SchedulesModule,
    FlowModule,
    HttpModule,
    AppointmentModule,
    IntegrationModule,
    ApiModule,
    CredentialsModule,
    SchedulingModule,
  ],
  providers: [
    BotdesignerService,
    BotdesignerEntitiesService,
    BotdesignerHelpersService,
    BotdesignerConfirmationService,
    BotdesignerDoctorService,
    BotdesignerApiService,
  ],
})
export class BotdesignerModule {}
