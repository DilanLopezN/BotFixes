import { Module } from '@nestjs/common';
import { OpenIaProviderService } from './providers/openai-provider.service';
import { GoogleIaProviderService } from './providers/google-provider.service';
import { AiProviderService } from './ai.service';

@Module({
    providers: [AiProviderService, OpenIaProviderService, GoogleIaProviderService],
    exports: [AiProviderService],
})
export class AiProviderModule {}
