import { Injectable } from '@nestjs/common';
import { OpenIaProviderService } from './providers/openai-provider.service';
import { AiExecuteData } from './interfaces/ai-execute-data';
import { GoogleIaProviderService } from './providers/google-provider.service';
import { AiExecute, AiGenerateEmbeddings, AIProviderType } from './interfaces';

@Injectable()
export class AiProviderService {
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

    public async execute(data: AiExecute): Promise<AiExecuteData> {
        return await this.getService(data.provider).execute(data);
    }

    // @TODO: reescrever este método que foi movido para cá futuramente e tipar corretamente
    public async sendMessage(data: any): Promise<any> {
        return await this.getService(data.provider).sendMessage(data);
    }

    public async generateEmbeddings(text: string): Promise<AiGenerateEmbeddings> {
        return this.openaiProviderService.generateEmbeddings(text);
    }
}
