import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenIaProviderService } from './providers/openai-provider.service';
import { GoogleIaProviderService } from './providers/google-provider.service';
import { AiEmbeddingService } from './ai-embedding.service';

@Module({
  providers: [AiService, OpenIaProviderService, GoogleIaProviderService, AiEmbeddingService],
  exports: [AiService, AiEmbeddingService],
})
export class AiModule {}
