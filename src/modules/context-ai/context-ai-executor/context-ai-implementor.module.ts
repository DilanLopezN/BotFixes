import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '../../_core/cache/cache.module';
import { ContextAiImplementorService } from './services/context-ai-implementor.service';
import { OpenIaProviderService } from './providers/openia.service';
import { ContextMessagesModule } from '../context-message/context-message.module';
import { ContextAiImplementorController } from './context-ai-implementor.controller';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ContextAiBuilderService } from './services/context-ai-builder.service';
import { ContextVariableModule } from '../context-variable/context-variable.module';
import { QuestionFiltersValidatorService } from './validators/question-filters.service';
import { ContextFallbackMessagesModule } from '../context-fallback-message/context-fallback-message.module';
import { ContextAiHistoricService } from './services/context-ai-historic.service';

@Module({
    imports: [
        CacheModule,
        ContextMessagesModule,
        EmbeddingsModule,
        ContextVariableModule,
        ContextFallbackMessagesModule,
    ],
    controllers: [ContextAiImplementorController],
    providers: [
        ContextAiImplementorService,
        OpenIaProviderService,
        ContextAiBuilderService,
        QuestionFiltersValidatorService,
        ContextAiHistoricService,
    ],
    exports: [ContextAiImplementorService, OpenIaProviderService, ContextAiBuilderService, ContextAiHistoricService],
})
export class ContextAiImplementorModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ContextAiImplementorController);
    }
}
