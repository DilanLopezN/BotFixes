import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './../../config/config.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { EventsModule } from '../events/events.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CacheModule } from '../_core/cache/cache.module';
import { ActiveMessageSettingController } from './controllers/active-message-setting.controller';
import { ExternalActiveMessageV1Controller } from './external-controller/external-active-message-v1.controller';
import { ActiveMessage } from './models/active-message.entity';
import { ActiveMessageSettingService } from './services/active-message-setting.service';
import { ActiveMessageService } from './services/active-message.service';
import { SendMessageService } from './services/send-message.service';
import { ACTIVE_MESSAGE_CONNECTION } from './ormconfig';
import { ActiveMessageSetting } from './models/active-message-setting.entity';
import { ActiveMessageStatusService } from './services/active-message-status.service';
import { Answer } from './models/answer.entity';
import { ActiveMessageStatusController } from './controllers/active-message-status.controller';

import { IncomingApiConsumerService } from './services/incoming-api-consumer.service';
import { ConversationInvalidNumberConsumerService } from './services/conversation-invalid-number-consumer.service';
import { SendActiveMessageIncomingData } from './models/send-active-message-data.entity';
import { SendActiveMessageIncomingDataService } from './services/send-active-message-incoming-data.service';
import { SendActiveMessageIncomingController } from './controllers/send-active-message-incoming.controller';
import { ExternalDataService } from './services/external-data.service';
import { ActiveMessageStatus } from './models/active-message-status.entity';
import { ActiveMessageResponseConsumerService } from './services/active-message-response-consumer.service';
import { synchronizePostgres } from '../../common/utils/sync';
import { ActiveMessageHealthCheckService } from './services/active-message-health-check.service';
import { ExternalDataWorkspaceService } from './services/external-data-workspace.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: ACTIVE_MESSAGE_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'active_message',
        }),
        TypeOrmModule.forFeature(
            [ActiveMessage, ActiveMessageSetting, ActiveMessageStatus, Answer, SendActiveMessageIncomingData],
            ACTIVE_MESSAGE_CONNECTION,
        ),
        EventsModule,
        CacheModule,
    ],
    controllers: [
        ExternalActiveMessageV1Controller,
        ActiveMessageSettingController,
        ActiveMessageStatusController,
        SendActiveMessageIncomingController,
    ],
    providers: [
        SendMessageService,
        ActiveMessageSettingService,
        ActiveMessageService,
        ActiveMessageStatusService,
        IncomingApiConsumerService,
        ConversationInvalidNumberConsumerService,
        SendActiveMessageIncomingDataService,
        ExternalDataService,
        ExternalDataWorkspaceService,
        ActiveMessageResponseConsumerService,
        ActiveMessageHealthCheckService,
    ],
    exports: [ActiveMessageService],
})
export class ActiveMessageModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                ActiveMessageSettingController,
                ActiveMessageStatusController,
                SendActiveMessageIncomingController,
            );
    }
}
