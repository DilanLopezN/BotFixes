import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AIProviderType } from '../../ai/interfaces';

@Index(['conversationId', 'integrationId', 'createdAt'])
@Entity({ name: 'report_processor_analytics' })
export class ReportProcessorAnalytics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'conversation_id', length: 100, nullable: false })
  conversationId: string;

  @Column({ name: 'integration_id', length: 24, nullable: false })
  integrationId: string;

  @Column({ name: 'model_provider', enum: AIProviderType, nullable: false })
  modelProvider: AIProviderType;

  @Column({ name: 'model_name', length: 50, nullable: true })
  modelName: string;

  @Column({ name: 'prompt_tokens_in', type: 'integer', nullable: true })
  promptTokensIn: number;

  @Column({ name: 'prompt_tokens_out', type: 'integer', nullable: true })
  promptTokensOut: number;

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText: string;

  @Column({ name: 'informations_extracted', type: 'jsonb', nullable: true })
  informationExtracted: string[];

  @Column({ name: 'error', length: 50, nullable: true })
  error: string;

  @Column({ name: 'error_message', length: 255, nullable: true })
  errorMessage: string;

  @Column({ name: 'had_error', type: 'boolean', default: false })
  hadError: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;
}
