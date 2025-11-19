import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentSourceType, IDocuments } from '../interfaces/documents.interface';

@Index(['integrationId', 'scheduleCode', 's3Key', 'createdAt'])
@Entity({ name: 'documents' })
export class Documents implements IDocuments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'integration_id', length: 24, nullable: false })
  integrationId: string;

  @Column({ name: 'schedule_code', length: 50, nullable: true })
  scheduleCode?: string;

  @Column({ name: 'name', length: 255, nullable: false })
  name: string;

  @Column({ name: 'original_name', length: 255, nullable: false })
  originalName: string;

  @Column({ name: 'description', length: 255, nullable: true })
  description?: string;

  @Column({ name: 's3_key', nullable: false })
  s3Key: string;

  @Column({ name: 'mime_type', nullable: false })
  mimeType: string;

  @Column({ name: 'extension', nullable: false })
  extension: string;

  @Column({ name: 'hash', length: 12, nullable: false })
  hash: string;

  @Column({ name: 'patient_code', length: 12, nullable: false })
  patientCode: string;

  @Column({ name: 'file_type_code', nullable: false })
  fileTypeCode: string;

  @Column({ name: 'appointment_type_code', nullable: false })
  appointmentTypeCode: string;

  @Column({ name: 'source', enum: DocumentSourceType, nullable: true })
  source: DocumentSourceType;

  @Column({ name: 'external_id', nullable: true })
  externalId?: string;

  @Column({ name: 'erp_username', nullable: true })
  erpUsername?: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;

  @Column({ name: 'erp_created_at', type: 'timestamp', nullable: true })
  erpCreatedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: false })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
