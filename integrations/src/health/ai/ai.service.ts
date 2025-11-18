import { Injectable } from '@nestjs/common';
import { OpenIaProviderService } from './providers/openai-provider.service';
import { AiExecuteData } from './interfaces/ai-execute-data';
import { GoogleIaProviderService } from './providers/google-provider.service';
import { AiExecute, AiExecuteFile, AIProviderType } from './interfaces';

@Injectable()
export class AiService {
  constructor(
    private readonly openaiProviderService: OpenIaProviderService,
    private readonly googleIaProviderService: GoogleIaProviderService,
  ) {}

  private getService(provider: AIProviderType | undefined) {
    switch (provider) {
      case AIProviderType.google:
        return this.googleIaProviderService;

      default:
        return this.openaiProviderService;
    }
  }

  public async executeFile({ file, fileUrl, prompt, provider }: AiExecuteFile): Promise<AiExecuteData> {
    return this.getService(provider).executeFile(prompt, file, fileUrl);
  }

  public async execute({ prompt, provider }: AiExecute): Promise<AiExecuteData> {
    return this.getService(provider).execute(prompt);
  }
}
