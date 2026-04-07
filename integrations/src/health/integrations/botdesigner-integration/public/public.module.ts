import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotdesignerPublicScheduleController } from './controllers/botdesigner-public-schedule.controller';
import { PublicScheduleService } from './services/public-schedule.service';
import { PublicAuthService } from './services/public-auth.service';
import { PublicScheduleConsumerService } from './services/public-schedule-consumer.service';
import { BotdesignerPublicTransaction } from './entities/botdesigner-public-transaction.entity';
import { BotdesignerPublicAuthToken } from './entities/botdesigner-public-auth-token.entity';
import { IntegrationModule } from '../../../integration/integration.module';
import { RabbitModule } from '../../../../common/rabbit-module/rabbit.module';
import { INTEGRATIONS_CONNECTION_NAME } from '../../../ormconfig';
import { AuthGuard } from '../../../../common/guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([BotdesignerPublicTransaction, BotdesignerPublicAuthToken], INTEGRATIONS_CONNECTION_NAME),
    IntegrationModule,
    RabbitModule,
  ],
  controllers: [BotdesignerPublicScheduleController],
  providers: [PublicScheduleService, PublicAuthService, PublicScheduleConsumerService, AuthGuard],
  exports: [PublicScheduleService, PublicAuthService],
})
export class PublicModule {}
