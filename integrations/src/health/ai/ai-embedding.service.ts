import { Injectable } from '@nestjs/common';
import { OpenIaProviderService } from './providers/openai-provider.service';
import { AiGenerateEmbeddings } from './interfaces';

@Injectable()
export class AiEmbeddingService {
  constructor(private readonly openaiProviderService: OpenIaProviderService) {}

  public async generateEmbeddings(text: string): Promise<AiGenerateEmbeddings> {
    return this.openaiProviderService.generateEmbeddings(text);
  }
}
