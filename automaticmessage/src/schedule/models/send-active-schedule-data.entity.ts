import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExtractResumeType } from './extract-resume.entity';
import { Schedule } from './schedule.entity';
import { Contact } from '../dto/external-send-active-schedule.dto';

@Entity()
export class SendActiveScheduleIncomingData {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ name: 'api_key', nullable: false })
  apiKey: string;

  @Column({ name: 'workspace_id', nullable: false })
  workspaceId: string;

  @Column({
    name: 'send_type',
    enum: ExtractResumeType,
    type: 'character varying',
  })
  sendType: ExtractResumeType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'schedule', type: 'jsonb' })
  schedule: Schedule;

  @Column({ name: 'contact', type: 'jsonb' })
  contact: Contact;
}
