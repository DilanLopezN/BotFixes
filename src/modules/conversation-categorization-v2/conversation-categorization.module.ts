import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConversationCategorizationService } from './services/conversation-categorization.service';
import { ConversationCategorization } from './models/conversation-categorization.entity';
import { EventsModule } from '../events/events.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { synchronizePostgres } from '../../common/utils/sync';
import { CONVERSATION_CATEGORIZATION_CONNECTION } from './ormconfig';
import { ConversationCategorizationController } from './controllers/conversation-categorization-controller';
import { ExternalDataService } from './services/external-data.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { ConversationObjective } from '../conversation-objective-v2/models/conversation-objective.entity';
import { ConversationOutcome } from '../conversation-outcome-v2/models/conversation-outcome.entity';

@Module({
    providers: [ConversationCategorizationService, ExternalDataService],
    controllers: [ConversationCategorizationController],
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: CONVERSATION_CATEGORIZATION_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [ConversationCategorization, ConversationObjective, ConversationOutcome],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'conversation_categorization',
        }),
        TypeOrmModule.forFeature([ConversationCategorization], CONVERSATION_CATEGORIZATION_CONNECTION),
        EventsModule,
    ],
    exports: [],
})
export class ConversationCategorizationModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ConversationCategorizationController);
    }
}
