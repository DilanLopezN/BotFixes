import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Schedule } from './schedule.entity';
import { ExtractResumeType } from './extract-resume.entity';
import { ScheduleSetting } from './schedule-setting.entity';
import { CancelReason } from './cancel-reason.entity';

export enum RecipientType {
  email = 'email',
  whatsapp = 'whatsapp',
  blank = 'blank',
  invalid = 'invalid',
}

export enum ScheduleMessageResponseType {
  'confirmed' = 'confirmed',
  'canceled' = 'canceled',
  'individual_cancel' = 'individual_cancel',
  'individual_cancel_not_completed' = 'individual_cancel_not_completed', // Quando o individual cancel confirmou ou cancelou alguns agendamentos apenas e em outra extração
  'reschedule' = 'reschedule',
  'invalid_number' = 'invalid_number',
  'open_cvs' = 'open_cvs',
  'no_recipient' = 'no_recipient',
  'invalid_recipient' = 'invalid_recipient',
  'start_reschedule_recover' = 'start_reschedule_recover',
  'cancel_reschedule_recover' = 'cancel_reschedule_recover',
  'confirm_reschedule_recover' = 'confirm_reschedule_recover',
  'confirm_reschedule' = 'confirm_reschedule',
}

export enum ScheduleMessageState {
  'AWAITING_SEND' = 'AWAITING_SEND', //Quando buscou do integrations e está aguardando a envio pro paciente
  'ENQUEUED_ACT_MSG' = 'ENQUEUED_ACT_MSG', //Quando enviou pra fila active message
  'AWAITING_RESPONSE' = 'AWAITING_RESPONSE', //Quando active message retornou que foi criado
  'AWAITING_SAVE_INTEGRATIONS' = 'AWAITING_SAVE_INTEGRATIONS', //Quando paciente respondeu e está aguardando salvar no integrations
  'SAVED_INTEGRATIONS' = 'SAVED_INTEGRATIONS', // Quando foi salvo no integrations
  'AWAITING_RESEND' = 'AWAITING_RESEND', //Quando está aguardando para tentar reenvio pro paciente
  'TRYED_RESEND' = 'TRYED_RESEND', // Quando gerou um novo registro para o reenvio e enfileirou
  'RETRY_RESEND_CONFIRM_RSPNS' = 'RETRY_RESEND_CONFIRM_RSPNS', // Mandou nova mensagem para usuarios que demorou determinado tempo para responder
  'SCHEDULE_CHANGED' = 'SCHEDULE_CHANGED', // Na verificação checkScheduleChanges verificou que houve mudanças no agendamento
  'SENT' = 'SENT', // Quando recebe o evento de enviado
  'NO_RECIPIENT' = 'NO_RECIPIENT', // Quando schedule não possue telefone ou email
  'INDIVIDUAL_CANCEL_NOT_COMPLETED' = 'INDIVIDUAL_CANCEL_NOT_COMPLETED', // Quando o individual cancel confirmou ou cancelou alguns agendamentos apenas e em outra extração
}

@Entity()
export class ScheduleMessage {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ name: 'uuid' })
  uuid?: string;

  @Column({ name: 'workspace_id', nullable: false })
  workspaceId: string;

  @Column({ name: 'conversation_id', nullable: true })
  conversationId?: string;

  @Column({ name: 'group_id', nullable: true })
  groupId: string;

  @Column({ type: 'numeric', name: 'schedule_id', nullable: false })
  scheduleId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @Column({
    name: 'send_type',
    default: ExtractResumeType.confirmation,
    enum: ExtractResumeType,
    type: 'character varying',
  })
  sendType: ExtractResumeType;

  @Column({
    name: 'setting_type_id',
    type: 'numeric',
    nullable: true,
    default: null,
  })
  settingTypeId?: number;

  @Column({ name: 'recipient', nullable: true })
  recipient: string;

  @Column({
    name: 'recipient_type',
    default: RecipientType.whatsapp,
    enum: RecipientType,
  })
  recipientType: RecipientType;

  @Column({
    name: 'state',
    default: ScheduleMessageState.AWAITING_SEND,
    enum: ScheduleMessageState,
  })
  state?: ScheduleMessageState;

  @Column({
    name: 'response_type',
    nullable: true,
    enum: ScheduleMessageResponseType,
  })
  responseType?: ScheduleMessageResponseType;

  @Column({ name: 'sended_at', nullable: true })
  sendedAt?: Date;

  @Column({ name: 'enqueued_at', nullable: true })
  enqueuedAt?: Date;

  @Column({ name: 'response_at', nullable: true })
  responseAt?: Date;

  @Column({ name: 'received_at', nullable: true })
  receivedAt?: Date;

  @Column({ name: 'read_at', nullable: true })
  readAt?: Date;

  @Column({ name: 'answered_at', nullable: true })
  answeredAt?: Date;

  @Column({ name: 'reason_id', type: 'numeric', nullable: true })
  reasonId?: number;

  @Column({ name: 'nps_score', type: 'numeric', nullable: true })
  npsScore?: number;

  @Column({ name: 'nps_score_comment', nullable: true })
  npsScoreComment?: string;

  @Column({ name: 'sending_group_type', nullable: true, default: 'principal' })
  sendingGroupType?: string;

  schedule?: Schedule;
  cancelReason?: CancelReason;
  setting?: ScheduleSetting;
  scheduleGroupList?: Schedule[];
}
