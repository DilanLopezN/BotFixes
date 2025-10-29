import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../../_core/cache/cache.module';
import { RedisModule } from '../../../common/redis/redis.module';
import { ContextAiImplementorService } from './services/context-ai-implementor.service';
import { ContextMessagesModule } from '../context-message/context-message.module';
import { ContextAiImplementorController } from './context-ai-implementor.controller';
import { AuthMiddleware } from '../../auth/middleware/auth.middleware';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ContextVariableModule } from '../context-variable/context-variable.module';
import { ContextFallbackMessagesModule } from '../context-fallback-message/context-fallback-message.module';
import { HistoricStorageService } from './storage/historic-storage.service';
import { AgentModule } from '../agent/agent.module';
import { AiProviderModule } from '../ai-provider/ai.module';
import { IntentDetectionModule } from '../intent-detection/intent-detection.module';
import { AgentSkillsModule } from '../agent-skills/agent-skills.module';
import { AgentToolsModule } from '../agent-tools/agent-tools.module';
import { AudioTtsModule } from '../audio-tts/audio-tts.module';
import { MessageAggregationStorageService } from './storage/message-aggregation-storage.service';
import { ConversationOrchestratorService } from './services/conversation-orchestrator.service';
import { AudioGenerationService } from './services/audio-generation.service';
import { QuestionRewriteProcessor } from './processors/question-rewrite-processor';
import { SmallTalkProcessor } from './processors/small-talk-processor';
import { ToolProcessor } from './processors/tool-processor';
import { RagProcessor } from './processors/rag-processor';
import { ContextMessagePersistenceService } from './services/context-message-persistence.service';
import { ResponseBuilderService } from './services/response-builder.service';
import { HistoryManagerService } from './services/history-manager.service';
import { GuardrailsModule } from '../guardrails/guardrails.module';
import { InputGuardrailsProcessor } from './processors/input-guardrails-processor';
import { AgentResolutionService } from './services/agent-resolution.service';
import { SessionStateService } from './services/session-state.service';
import { ContextSwitchDetectorService } from './services/context-switch-detector.service';
import { TransitionMessageService } from './services/transition-message.service';
import { ConversationalAgentsModule } from '../conversational-agents/conversational-agents.module';
import { ConversationalAgentProcessor } from './processors/conversational-agent-processor';
import { ConversationTraceService } from './services/conversation-trace.service';
import { ConversationTraceController } from './conversation-trace.controller';
import { ConversationTraceEntity } from './entities/conversation-trace.entity';
import { CONTEXT_AI } from '../ormconfig';
import { SmallTalkModule } from '../small-talk/small-talk.module';
import { QuestionRewriteModule } from '../question-rewrite/question-rewrite.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ConversationTraceEntity], CONTEXT_AI),
        CacheModule,
        RedisModule,
        ContextMessagesModule,
        EmbeddingsModule,
        ContextVariableModule,
        ContextFallbackMessagesModule,
        AgentModule,
        AiProviderModule,
        IntentDetectionModule,
        AgentSkillsModule,
        AgentToolsModule,
        AudioTtsModule,
        GuardrailsModule,
        ConversationalAgentsModule,
        forwardRef(() => SmallTalkModule),
        forwardRef(() => QuestionRewriteModule),
    ],
    controllers: [ContextAiImplementorController, ConversationTraceController],
    providers: [
        ContextAiImplementorService,
        HistoricStorageService,
        MessageAggregationStorageService,
        ConversationOrchestratorService,
        AudioGenerationService,
        InputGuardrailsProcessor,
        QuestionRewriteProcessor,
        SmallTalkProcessor,
        ConversationalAgentProcessor,
        ToolProcessor,
        RagProcessor,
        ContextMessagePersistenceService,
        ResponseBuilderService,
        HistoryManagerService,
        AgentResolutionService,
        SessionStateService,
        ContextSwitchDetectorService,
        TransitionMessageService,
        ConversationTraceService,
    ],
    exports: [
        ContextAiImplementorService,
        HistoricStorageService,
        ConversationOrchestratorService,
        HistoryManagerService,
        SessionStateService,
    ],
})
export class ContextAiImplementorModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes(ContextAiImplementorController, ConversationTraceController);
    }
}
