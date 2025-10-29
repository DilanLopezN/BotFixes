import { Module, forwardRef } from '@nestjs/common';
import { SmallTalkService } from './small-talk.service';
import { IntentClassifierService } from './services/intent-classifier.service';
import { ResponseGeneratorService } from './services/response-generator.service';
import { ResponseContextBuilderService } from './services/response-context-builder.service';
import { SmallTalkPromptBuilder } from './builders/small-talk-prompt.builder';
import { ResponsePromptBuilder } from './builders/response-prompt.builder';
import { AiProviderModule } from '../ai-provider/ai.module';
import { ContextVariableModule } from '../context-variable/context-variable.module';
import { ContextAiImplementorModule } from '../context-ai-executor/context-ai-implementor.module';

@Module({
    imports: [AiProviderModule, ContextVariableModule, forwardRef(() => ContextAiImplementorModule)],
    providers: [
        SmallTalkService,
        IntentClassifierService,
        ResponseGeneratorService,
        ResponseContextBuilderService,
        SmallTalkPromptBuilder,
        ResponsePromptBuilder,
    ],
    exports: [SmallTalkService],
})
export class SmallTalkModule {}
