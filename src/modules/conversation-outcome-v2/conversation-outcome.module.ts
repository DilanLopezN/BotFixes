import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConversationOutcomeService } from './services/conversation-outcome.service';
import { ConversationOutcome } from './models/conversation-outcome.entity';
import { EventsModule } from '../events/events.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationOutcomeController } from './controllers/conversation-outcome-controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CONVERSATION_CATEGORIZATION_CONNECTION } from '../conversation-categorization-v2/ormconfig';

@Module({
    providers: [ConversationOutcomeService],
    controllers: [ConversationOutcomeController],
    imports: [TypeOrmModule.forFeature([ConversationOutcome], CONVERSATION_CATEGORIZATION_CONNECTION), EventsModule],
    exports: [],
})
export class ConversationOutcomeModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ConversationOutcomeController);
    }
}
