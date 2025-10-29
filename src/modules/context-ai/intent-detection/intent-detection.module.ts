import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntentDetection } from './entities/intent-detection.entity';
import { IntentActions } from './entities/intent-actions.entity';
import { IntentDetectionUserHistory } from './entities/intent-detection-user-history.entity';
import { IntentDetectionService } from './services/intent-detection.service';
import { IntentActionsService } from './services/intent-actions.service';
import { IntentDetectionUserHistoryService } from './services/intent-detection-user-history.service';
import { IntentDetectionController } from './controllers/intent-detection.controller';
import { IntentActionsController } from './controllers/intent-actions.controller';
import { CONTEXT_AI } from '../ormconfig';
import { OpenIaProviderService } from '../ai-provider/providers/openai-provider.service';
import { AgentModule } from '../agent/agent.module';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { MessageContextValidator } from './validator/message-context.validator';
import { InteractionsModule } from '../../interactions/interactions.module';
import { AiProviderModule } from '../ai-provider/ai.module';
import { IntentLibraryModule } from '../intent-library/intent-library.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([IntentDetection, IntentActions, IntentDetectionUserHistory], CONTEXT_AI),
        AgentModule,
        forwardRef(() => InteractionsModule),
        AiProviderModule,
        IntentLibraryModule,
    ],
    controllers: [IntentDetectionController, IntentActionsController],
    providers: [
        IntentDetectionService,
        IntentActionsService,
        IntentDetectionUserHistoryService,
        OpenIaProviderService,
        MessageContextValidator,
    ],
    exports: [IntentDetectionService, IntentActionsService, IntentDetectionUserHistoryService],
})
export class IntentDetectionModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(IntentDetectionController, IntentActionsController);
    }
}
