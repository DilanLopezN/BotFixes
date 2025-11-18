import { AIProviderType } from '../../ai/interfaces';

export interface ReportProcessorAnalyticsInterface {
  id?: number;
  conversationId: string;
  integrationId: string;
  modelProvider: AIProviderType;
  modelName: string;
  promptTokensIn: number;
  promptTokensOut: number;
  extractedText: string;
  informationExtracted: string[];
  error: string;
  errorMessage: string;
  hadError: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
