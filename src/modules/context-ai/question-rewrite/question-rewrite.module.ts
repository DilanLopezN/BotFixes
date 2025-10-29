import { Module, forwardRef } from '@nestjs/common';
import { QuestionRewriteService } from './question-rewrite.service';
import { RewritePromptBuilder } from './builders/rewrite-prompt.builder';
import { AiProviderModule } from '../ai-provider/ai.module';
import { ContextMessagesModule } from '../context-message/context-message.module';
import { ContextAiImplementorModule } from '../context-ai-executor/context-ai-implementor.module';

@Module({
    imports: [AiProviderModule, ContextMessagesModule, forwardRef(() => ContextAiImplementorModule)],
    providers: [QuestionRewriteService, RewritePromptBuilder],
    exports: [QuestionRewriteService],
})
export class QuestionRewriteModule {}
