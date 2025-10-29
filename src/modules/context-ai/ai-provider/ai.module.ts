import { Module } from '@nestjs/common';
import { OpenIaProviderService } from './providers/openai-provider.service';
import { GoogleIaProviderService } from './providers/google-provider.service';
import { AiProviderService } from './ai.service';
import { GroqProviderService } from './providers/groq-provider.service';

@Module({
    providers: [AiProviderService, OpenIaProviderService, GoogleIaProviderService, GroqProviderService],
    exports: [AiProviderService, OpenIaProviderService],
})
export class AiProviderModule {}
