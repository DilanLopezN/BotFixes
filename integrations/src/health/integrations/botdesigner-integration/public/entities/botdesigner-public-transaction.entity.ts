import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BotdesignerPublicTransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('botdesigner_public_transactions')
@Index(['integrationId', 'status', 'createdAt'])
@Index(['integrationId', 'requestId'])
export class BotdesignerPublicTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'request_id', type: 'uuid', unique: true })
  requestId: string;

  @Column({ name: 'integration_id', length: 24 })
  integrationId: string;

  @Column({ name: 'auth_token_id', type: 'int', nullable: true })
  authTokenId: number;

  @Column({ name: 'method_name', length: 100 })
  methodName: string;

  @Column({ type: 'varchar', length: 20, default: BotdesignerPublicTransactionStatus.PENDING })
  status: BotdesignerPublicTransactionStatus;

  @Column({ type: 'jsonb', name: 'input_payload' })
  inputPayload: any;

  @Column({ type: 'jsonb', name: 'output_payload', nullable: true })
  outputPayload: any;

  @Column({ type: 'jsonb', nullable: true })
  extra: any;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
