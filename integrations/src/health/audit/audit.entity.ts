import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AuditDataType } from './audit.interface';

@Index(['conversationId', 'integrationId'])
@Entity({ name: 'health_audit' })
export class Audit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'integration_id', length: 24 })
  integrationId: string;

  @Column({ name: 'conversation_id', length: 24, nullable: true })
  conversationId: string;

  @Column({ name: 'patient_phone', nullable: true })
  patientPhone: string;

  @Column({ name: 'ctx_id' })
  ctxId: string;

  @Column({ name: 'data_type', enum: AuditDataType })
  dataType: AuditDataType;

  @Column({ name: 'identifier', nullable: true })
  identifier?: string;

  @Column({ name: 'data', type: 'json', nullable: true })
  data: any;

  @Column({ name: 'created_at', type: 'bigint' })
  createdAt: number;
}
