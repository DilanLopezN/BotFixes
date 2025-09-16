import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ScheduleSetting } from './schedule-setting.entity';
import { ReminderSetting } from './reminder-setting.entity';
import { ScheduleGroupRule } from '../interfaces/schedule-group-rule.enum';
import { RecipientType } from './schedule-message.entity';

export enum ManyScheduleBehaviorType {
  CONFIRM_ALL = 'CONFIRM_ALL',
  CONFIRM_ONE = 'CONFIRM_ONE',
  SEQUENTIAL_CONFIRM = 'SEQUENTIAL_CONFIRM',
}

@Entity()
export class ConfirmationSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'numeric', name: 'schedule_setting_id', nullable: false })
  scheduleSettingId: number;

  @Column({
    type: 'numeric',
    name: 'save_schedule_retry_count',
    nullable: false,
    default: 3,
  })
  saveScheduleRetryCount: number; //Quantas vezes deve tentar salvar a resposta do paciente no integrations

  @Column({
    name: 'many_schedule_behavior',
    nullable: false,
    enum: ManyScheduleBehaviorType,
    default: ManyScheduleBehaviorType.CONFIRM_ALL,
  })
  manyScheduleBehavior: ManyScheduleBehaviorType; //O que deve fazer quando tem mais de um agendamento no dia. Confirmar todos com uma mensagem, confirmar apenas o primeiro, confirmar um depois da resposta do paciente confirmar outro e assim até acabar todos

  @Column({
    type: 'numeric',
    name: 'send_whats_before_schedule_date',
    default: 48,
    nullable: true,
  })
  sendWhatsBeforeScheduleDate?: number; // Quantas horas antes da data do agendamento deve enviar o email

  @Column({
    type: 'numeric',
    name: 'send_email_before_schedule_date',
    nullable: true,
  })
  sendEmailBeforeScheduleDate?: number; // Quantas horas antes da data do agendamento deve enviar o email

  @Column({ name: 'workspace_id', nullable: false })
  workspaceId: string;

  @Column({ name: 'erp_params', nullable: true })
  erpParams?: string;

  @Column({
    name: 'group_rule',
    nullable: true,
    default: ScheduleGroupRule.firstOfRange,
  })
  groupRule?: ScheduleGroupRule;

  @Column({
    name: 'time_to_send_whats_after_email',
    nullable: false,
    default: 60,
  })
  timeToSendWhatsAfterEmail: number; // Em minutos

  @Column({ name: 'api_token', nullable: false })
  apiToken: string;

  @Column({ name: 'template_id', nullable: false })
  templateId: string;

  @Column({ name: 'active', nullable: false, default: true })
  active: boolean;

  @Column({ name: 'resend_msg_no_match', nullable: true, default: false })
  resendMsgNoMatch?: boolean;

  @Column({ name: 'retry_invalid', nullable: true, default: false })
  retryInvalid: boolean;

  @Column({
    name: 'send_recipient_type',
    nullable: true,
    default: RecipientType.whatsapp,
  })
  sendRecipientType?: RecipientType;

  @Column({ name: 'email_sending_setting_id', nullable: true, type: 'numeric' })
  emailSendingSettingId?: number;

  @Column({ name: 'sending_group_type', nullable: true, default: 'principal' })
  sendingGroupType?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  scheduleSetting?: ScheduleSetting;
  reminderSetting?: ReminderSetting;
}
