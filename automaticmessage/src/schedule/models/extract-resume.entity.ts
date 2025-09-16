import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExtractRule } from './schedule-setting.entity';

export enum ExtractResumeState {
  AWAITING_RUN = 'AWAITING_RUN',
  RUNNING = 'RUNNING',
  ENDED = 'ENDED',
  ENDED_LOCK = 'ENDED_LOCK', // Finalizou pois estava travado processamento
  ENDED_ERROR = 'ENDED_ERROR',
}

export enum ExtractResumeType {
  confirmation = 'confirmation',
  reminder = 'reminder',
  nps = 'nps', //Net Promoter Score / Pesquisa de satisfação - apenas envio do link de NPS do cliente
  medical_report = 'medical_report',
  schedule_notification = 'schedule_notification', // Notificação de que foi realizado um agendamento
  recover_lost_schedule = 'recover_lost_schedule', // Recuperação de agendamentos perdidos
  nps_score = 'nps_score', //Net Promoter Score - NPS do agendamento/atendimento
  documents_request = 'documents_request', // Solicitação de documento
  active_mkt = 'active_mkt', // Disparos dinamicos de mkt
}

@Entity()
export class ExtractResume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'workspace_id', nullable: false })
  workspaceId: string;

  @Column({ name: 'schedule_setting_id', type: 'numeric', nullable: false })
  scheduleSettingId: number;

  @Column({ name: 'setting_type_id', type: 'numeric', nullable: true })
  settingTypeId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'started_at', nullable: true })
  startedAt?: Date;

  @Column({ name: 'end_at', nullable: true })
  endAt?: Date;

  @Column({ name: 'start_range_date', nullable: true })
  startRangeDate?: Date;

  @Column({ name: 'end_range_date', nullable: true })
  endRangeDate?: Date;

  @Column({
    name: 'state',
    nullable: false,
    enum: ExtractResumeState,
    default: ExtractResumeState.AWAITING_RUN,
  })
  state: ExtractResumeState;

  @Column({
    name: 'type',
    nullable: true,
    enum: ExtractResumeType,
    default: ExtractResumeType.confirmation,
  })
  type?: ExtractResumeType;

  @Column({
    name: 'extract_rule',
    nullable: false,
    default: ExtractRule.DEFAULT,
    type: 'character varying',
  })
  extractRule: ExtractRule;

  @Column({ name: 'error', type: 'character varying', nullable: true })
  error?: string;

  @Column({
    name: 'extracted_count',
    type: 'numeric',
    nullable: true,
    default: null,
  })
  extractedCount?: number;

  @Column({
    name: 'processed_count',
    type: 'numeric',
    nullable: true,
    default: null,
  })
  processedCount?: number;

  @Column({
    name: 'sended_count',
    type: 'numeric',
    nullable: true,
    default: null,
  })
  sendedCount?: number;

  @Column({ name: 'uuid', default: null })
  uuid?: string;
}
