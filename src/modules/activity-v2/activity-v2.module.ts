import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationActivity, ActivityAck } from 'kissbot-entities';
import { CONVERSATION_CONNECTION } from './ormconfig';
import { ActivityV2AckService } from './services/activity-v2-ack.service';
import { ActivityV2Service } from './services/activity-v2.service';
import { synchronizePostgres } from '../../common/utils/sync';
import { ConversationHealthCheckService } from './services/conversation-health-check.service';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CONVERSATION_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [ConversationActivity, ActivityAck],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'conversation',
            extra: {
                min: 2,
            },
        }),
        TypeOrmModule.forFeature([ConversationActivity, ActivityAck], CONVERSATION_CONNECTION),
    ],
    providers: [ActivityV2Service, ActivityV2AckService, ConversationHealthCheckService],
    exports: [ActivityV2Service, ActivityV2AckService],
})
export class ActivityV2Module {}
