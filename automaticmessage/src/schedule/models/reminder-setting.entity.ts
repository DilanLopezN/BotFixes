import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ScheduleGroupRule } from '../interfaces/schedule-group-rule.enum';
import { RecipientType } from './schedule-message.entity';

@Entity()
export class ReminderSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'numeric', name: 'schedule_setting_id', nullable: false })
  scheduleSettingId: number;

  @Column({ name: 'workspace_id', nullable: false })
  workspaceId: string;

  @Column({ name: 'send_before_schedule_date', nullable: false, default: 24 })
  sendBeforeScheduleDate?: number; // Quantidade em horas do momento atual pra frente que deve ser enviado os lembretes

  @Column({ name: 'api_token', nullable: false })
  apiToken: string;

  @Column({ name: 'erp_params', nullable: true })
  erpParams?: string;

  @Column({ name: 'template_id', nullable: false })
  templateId: string;

  @Column({
    name: 'group_rule',
    nullable: true,
    default: ScheduleGroupRule.firstOfRange,
  })
  groupRule?: ScheduleGroupRule;

  @Column({ name: 'active', nullable: false, default: true })
  active: boolean;

  @Column({ name: 'retry_invalid', nullable: true, default: false })
  retryInvalid: boolean;

  @Column({ name: 'send_action', nullable: true, default: false })
  sendAction?: boolean;

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
}
