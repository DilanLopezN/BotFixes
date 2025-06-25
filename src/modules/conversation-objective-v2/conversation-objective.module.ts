import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConversationObjectiveService } from './services/conversation-objective.service';
import { ConversationObjective } from './models/conversation-objective.entity';
import { EventsModule } from '../events/events.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationObjectiveController } from './controllers/conversation-objective-controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CONVERSATION_CATEGORIZATION_CONNECTION } from '../conversation-categorization-v2/ormconfig';

@Module({
    providers: [ConversationObjectiveService],
    controllers: [ConversationObjectiveController],
    imports: [TypeOrmModule.forFeature([ConversationObjective], CONVERSATION_CATEGORIZATION_CONNECTION), EventsModule],
    exports: [],
})
export class ConversationObjectiveModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ConversationObjectiveController);
    }
}
