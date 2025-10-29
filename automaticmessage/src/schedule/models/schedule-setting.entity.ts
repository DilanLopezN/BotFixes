import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConfirmationSetting } from './confirmation-setting.entity';
import { ReminderSetting } from './reminder-setting.entity';
import { SendSetting } from './send-setting.entity';

export enum ExtractRule {
  MANUAL = 'MANUAL',
  DEFAULT = 'DEFAULT',
  DEFAULT_CALENDAR = 'DEFAULT_CALENDAR',
  DAILY = 'DAILY',
  HOURLY = 'HOURLY',
  DAILYV2 = 'DAILYV2',
}

@Entity()
export class ScheduleSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'numeric',
    name: 'get_schedule_interval',
    nullable: false,
    default: 120,
  })
  getScheduleInterval: number; //Determina de qt em qt tempo deve buscar agendamentos do integrations em minutos

  @Column({
    type: 'numeric',
    name: 'extract_at',
    nullable: false,
    default: 120,
  })
  extractAt: number; //Determina a hora do dia que deve executar o schedule. é definido em minutos

  @Column({ name: 'workspace_id', nullable: false })
  workspaceId: string;

  @Column({ name: 'api_key', nullable: false })
  apiKey: string;

  @Column({ name: 'name', nullable: true })
  name?: string;

  @Column({ name: 'alias', nullable: true })
  alias?: string;

  @Column({
    name: 'use_speciality_on_exam_message',
    nullable: false,
    default: false,
  })
  useSpecialityOnExamMessage?: boolean;

  @Column({
    name: 'omit_appointment_type_name',
    nullable: false,
    default: false,
  })
  omitAppointmentTypeName?: boolean;

  @Column({
    name: 'omit_doctor_name',
    nullable: false,
    default: false,
  })
  omitDoctorName?: boolean;

  @Column({ name: 'omit_extract_guidance', nullable: false, default: false })
  omitExtractGuidance?: boolean;

  @Column({
    name: 'friday_join_weekend_monday',
    nullable: false,
    default: false,
  })
  fridayJoinWeekendMonday?: boolean;

  @Column({ name: 'send_only_principal_exam', nullable: true, default: false })
  sendOnlyPrincipalExam?: boolean;

  @Column({ name: 'enable_send_retry', nullable: true, default: false })
  enableSendRetry?: boolean;

  @Column({
    name: 'enable_resend_not_answered',
    nullable: true,
    default: false,
  })
  enableResendNotAnswered?: boolean;

  @Column({
    name: 'use_is_first_come_first_served_as_time',
    nullable: true,
    default: false,
  })
  useIsFirstComeFirstServedAsTime?: boolean;

  @Column({
    name: 'use_organization_unit_on_group_description',
    nullable: true,
    default: false,
  })
  useOrganizationUnitOnGroupDescription?: boolean;

  @Column({ name: 'check_schedule_changes', nullable: true, default: false })
  checkScheduleChanges?: boolean;

  @Column({
    name: 'omit_time_on_group_description',
    nullable: true,
    default: false,
  })
  omitTimeOnGroupDescription?: boolean;

  @Column({ name: 'use_send_full_day', nullable: true, default: false })
  useSendFullDay?: boolean;

  // Número inteiro para qtd em hora que deve mandar nova mensagem por falta de resposta na confirmação
  @Column({ type: 'numeric', name: 'time_resend_not_answered', nullable: true })
  timeResendNotAnswered?: number;

  @Column({ name: 'integration_id', nullable: false })
  integrationId: string;

  @Column({
    name: 'extract_rule',
    nullable: false,
    default: ExtractRule.DEFAULT,
  })
  extractRule: ExtractRule;

  @Column({ name: 'active', nullable: false, default: true })
  active: boolean;

  @Column({ name: 'external_extract', nullable: true, default: false })
  externalExtract?: boolean;

  @Column({
    name: 'build_description_with_address',
    nullable: true,
    default: false,
  })
  buildDescriptionWithAddress?: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  confirmationSettings?: ConfirmationSetting[];
  reminderSettings?: ReminderSetting[];
  sendSettings?: SendSetting[];
}
