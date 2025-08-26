import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONVERSATION_ATTRIBUTE } from './ormconfig';
import { ConversationAttributeEntity } from './entities/conversation-attribute.entity';
import { ConversationAttributeService } from './services/conversation-attribute.service';
import { EventsModule } from '../events/events.module';

@Module({
    providers: [ConversationAttributeService],
    exports: [ConversationAttributeService],
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CONVERSATION_ATTRIBUTE,
            replication: {
                master: {
                    url: process.env.POSTGRESQL_URI,
                },
                slaves: [
                    {
                        url: process.env.POSTGRESQL_READ_URI,
                    },
                ],
            },
            entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
            synchronize: false,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'conversation',
            extra: {
                min: 3,
            },
        }),
        TypeOrmModule.forFeature([ConversationAttributeEntity], CONVERSATION_ATTRIBUTE),
        EventsModule,
    ],
})
export class ConversationAttributeModuleV2 {}
