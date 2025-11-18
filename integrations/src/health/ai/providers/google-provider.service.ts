import { Injectable, Logger } from '@nestjs/common';
import { AiExecuteData } from '../interfaces/ai-execute-data';
import { File } from '../../../common/interfaces/uploaded-file';
import { clientGoogle } from '../helpers/google-instance';
import { AIProvider } from '../interfaces';
import axios from 'axios';
import { GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GoogleIaProviderService implements AIProvider {
  private logger = new Logger(GoogleIaProviderService.name);
  private model: GenerativeModel;

  constructor() {
    this.model = clientGoogle();
  }

  public async execute(prompt: string): Promise<AiExecuteData> {
    try {
      const chatSession = this.model.startChat({
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'text/plain',
        },
        history: [],
      });

      const result = await chatSession.sendMessage(prompt);

      return {
        message: result.response.text(),
        promptTokens: result.response.usageMetadata.promptTokenCount,
        completionTokens: result.response.usageMetadata.candidatesTokenCount,
      };
    } catch (error) {
      this.logger.error('GoogleIaProviderService.execute', error);
      throw error;
    }
  }

  public async executeFile(prompt: string, file: File, fileUrl: string): Promise<AiExecuteData> {
    let mimeType: string = null;
    let base64Image: string = null;

    if (file) {
      base64Image = file.buffer.toString('base64');
      mimeType = file.mimetype;
    } else {
      const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });

      base64Image = Buffer.from(fileResponse.data, 'binary').toString('base64');
      mimeType = fileResponse.headers['content-type'];
    }

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ];

    const result = await this.model.generateContent([prompt, ...imageParts]);

    return {
      message: result.response.text(),
      promptTokens: result.response.usageMetadata.promptTokenCount,
      completionTokens: result.response.usageMetadata.candidatesTokenCount,
    };
  }
}
