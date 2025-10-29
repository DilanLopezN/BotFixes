import { Module } from '@nestjs/common';
import { RedisModule } from '../../../common/redis/redis.module';
import { AiProviderModule } from '../ai-provider/ai.module';
import { ContextVariableModule } from '../context-variable/context-variable.module';
import { ConversationContextService } from './services/conversation-context.service';
import { ConversationalAgentRegistry } from './services/conversational-agent-registry.service';
import { SuggestedActionsService } from './services/suggested-actions.service';
import { InternmentAgent } from './agents/internment.agent';
import { ComplaintAgent } from './agents/complaint.agent';
import { JobApplicationAgent } from './agents/job-application.agent';

@Module({
    imports: [RedisModule, AiProviderModule, ContextVariableModule],
    providers: [
        ConversationContextService,
        ConversationalAgentRegistry,
        SuggestedActionsService,
        InternmentAgent,
        ComplaintAgent,
        JobApplicationAgent,
    ],
    exports: [ConversationContextService, ConversationalAgentRegistry, SuggestedActionsService],
})
export class ConversationalAgentsModule {}
