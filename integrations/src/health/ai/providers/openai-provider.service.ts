import { Injectable, Logger } from '@nestjs/common';
import { clientOpenAI } from '../helpers/openai-instance';
import { AiExecuteData } from '../interfaces/ai-execute-data';
import { AiGenerateEmbeddings } from '../interfaces/ai-generate-embeddings';
import OpenAI from 'openai';
import { File } from '../../../common/interfaces/uploaded-file';
import axios from 'axios';
import { AIProvider } from '../interfaces';

@Injectable()
export class OpenIaProviderService implements AIProvider {
  private logger = new Logger(OpenIaProviderService.name);
  private modelName = 'gpt-4o-mini';
  private embeddingModelName = 'text-embedding-3-small';
  private openai: OpenAI;

  constructor() {
    this.openai = clientOpenAI();
  }

  private prepareTextToEmbedding(text: string) {
    return text.trim().toLowerCase();
  }

  public async generateEmbeddings(text: string): Promise<AiGenerateEmbeddings> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModelName,
        input: this.prepareTextToEmbedding(text),
      });

      return {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens,
      };
    } catch (error) {
      this.logger.error('OpenIaProviderService.getEmbeddingFromText', error);
      throw error;
    }
  }

  public async execute(prompt: string): Promise<AiExecuteData> {
    try {
      const response = await this.openai.chat.completions.create(
        {
          model: this.modelName,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 2048,
          temperature: 0,
        },
        {
          timeout: 10_000,
        },
      );

      return {
        message: response.choices[0].message.content.trim(),
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
      };
    } catch (error) {
      this.logger.error('OpenIaProviderService.execute', error);
      throw error;
    }
  }

  public async executeFile(prompt: string, file: File, fileUrl: string): Promise<AiExecuteData> {
    let dataURL: string = null;

    if (file) {
      const base64Image = file.buffer.toString('base64');
      dataURL = `data:${file.mimetype};base64,${base64Image}`;
    } else {
      const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(fileResponse.data, 'binary').toString('base64');
      const mimeType = fileResponse.headers['content-type'];

      dataURL = `data:${mimeType};base64,${base64Image}`;
    }

    const response = await this.openai.chat.completions.create({
      model: this.modelName,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: { url: dataURL },
            },
          ],
        },
      ],
      store: true,
    });

    return {
      message: response.choices[0].message.content.trim(),
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
    };
  }
}
