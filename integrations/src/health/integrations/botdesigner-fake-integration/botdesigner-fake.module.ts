import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesModule } from '../../entities/entities.module';
import { FlowModule } from '../../flow/flow.module';
import { IntegrationCacheUtilsModule } from '../../integration-cache-utils/integration-cache-utils.module';
import { SchedulesModule } from '../../schedules/schedules.module';
import { SharedModule } from '../../shared/shared.module';
import { BotdesignerFakeEntitiesService } from './services/botdesigner-fake-entities.service';
import { BotdesignerFakeService } from './services/botdesigner-fake.service';
import { BotdesignerFakeHelpersService } from './services/botdesigner-fake-helpers.service';
import { BotdesignerFakeConfirmationService } from './services/botdesigner-fake-confirmation.service';
import { BotdesignerFakeApiService } from './services/botdesigner-fake-api.service';
import { BotdesignerFakePatient } from './entities/botdesigner-fake-patient.entity';
import { BotdesignerFakeAppointment } from './entities/botdesigner-fake-appointment.entity';
import { BOTDESIGNER_FAKE_CONNECTION_NAME } from '../../ormconfig';
import { AppointmentModule } from '../../analytics/appointment/appointment.module';
import { IntegrationModule } from '../../integration/integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BotdesignerFakePatient, BotdesignerFakeAppointment], BOTDESIGNER_FAKE_CONNECTION_NAME),
    EntitiesModule,
    IntegrationCacheUtilsModule,
    SharedModule,
    SchedulesModule,
    FlowModule,
    AppointmentModule,
    IntegrationModule,
  ],
  providers: [
    BotdesignerFakeService,
    BotdesignerFakeEntitiesService,
    BotdesignerFakeHelpersService,
    BotdesignerFakeConfirmationService,
    BotdesignerFakeApiService,
  ],
})
export class BotdesignerFakeModule {}
