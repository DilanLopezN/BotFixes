import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ScheduleMessage } from './schedule-message.entity';
import { ConfirmationSetting } from './confirmation-setting.entity';
import { SendSetting } from './send-setting.entity';

@Entity()
@Index('schedule_created_at_idx', ['createdAt'])
@Index('schedule_group_id_idx', ['groupId'])
@Index(
  'schedule_schedule_code_schedule_date_workspace_id_integrati_idx',
  [
    'scheduleCode',
    'scheduleDate',
    'workspaceId',
    'integrationId',
    'patientCode',
  ],
  {
    unique: true,
  },
)
@Index('schedule_workspace_id_patient_code_integration_id_schedule__idx', [
  'workspaceId',
  'patientCode',
  'integrationId',
  'scheduleCode',
])
export class Schedule {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'numeric', name: 'schedule_setting_id', nullable: false })
  scheduleSettingId: number;

  @Column({ type: 'numeric', name: 'extract_resume_id', nullable: true })
  extractResumeId?: number;

  @Column({ name: 'workspace_id', nullable: false })
  workspaceId: string;

  @Column({ name: 'integration_id', nullable: false })
  integrationId: string;

  @Column({ name: 'group_id', nullable: true })
  groupId?: string;

  @Column({ name: 'group_code_list', nullable: true })
  groupCodeList?: string;

  @Column({ name: 'group_id_list', nullable: true })
  groupIdList?: string;

  @Column({ name: 'group_count', nullable: true, type: 'numeric' })
  groupCount?: number;

  @Column({ name: 'group_description', nullable: true })
  groupDescription?: string;

  @Column({ name: 'organization_unit_address', nullable: true })
  organizationUnitAddress: string;

  @Column({ name: 'organization_unit_name', nullable: true })
  organizationUnitName: string;

  @Column({ name: 'organization_unit_code', nullable: true })
  organizationUnitCode: string;

  @Column({ name: 'procedure_name', nullable: true })
  procedureName: string;

  @Column({ name: 'speciality_name', nullable: true })
  specialityName: string;

  @Column({ name: 'speciality_code', nullable: true })
  specialityCode: string;

  @Column({ name: 'procedure_code', nullable: true })
  procedureCode: string;

  @Column({ name: 'doctor_observation', nullable: true })
  doctorObservation: string;

  @Column({ name: 'doctor_name', nullable: true })
  doctorName: string;

  @Column({ name: 'doctor_code', nullable: true })
  doctorCode: string;

  @Column({ name: 'insurance_name', nullable: true })
  insuranceName?: string;

  @Column({ name: 'insurance_code', nullable: true })
  insuranceCode?: string;

  @Column({ name: 'insurance_plan_name', nullable: true })
  insurancePlanName?: string;

  @Column({ name: 'insurance_plan_code', nullable: true })
  insurancePlanCode?: string;

  @Column({ name: 'appointment_type_name', nullable: true })
  appointmentTypeName: string;

  @Column({ name: 'appointment_type_code', nullable: true })
  appointmentTypeCode: string;

  @Column({ name: 'schedule_code', nullable: false })
  scheduleCode: string;

  /**
   * ATENÇÃO: Campo scheduleId do schedule não é o mesmo do scheduleId do scheudle_message. na entidade schedule o scheduleId é o do integrations e na
   *   entidade schedule_message é a referencia pra join do schedule.id
   */
  @Column({ name: 'schedule_id', nullable: true })
  scheduleId?: string;

  @Column({ name: 'principal_schedule_code', length: 60, nullable: true })
  principalScheduleCode: string;

  @Column({ name: 'is_principal', nullable: false, default: true })
  isPrincipal: boolean;

  @Column({
    name: 'is_first_come_first_served',
    nullable: true,
    default: false,
  })
  isFirstComeFirstServed?: boolean;

  @Column({ name: 'schedule_date', nullable: false })
  scheduleDate: Date;

  @Column({ name: 'patient_phone', nullable: true })
  patientPhone: string;

  @Column({ name: 'patient_email', nullable: true })
  patientEmail: string;

  @Column({ name: 'patient_name', nullable: true })
  patientName: string;

  @Column({ name: 'patient_code', nullable: true })
  patientCode: string = '';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'data', type: 'jsonb', nullable: true })
  data?: any;

  conversationId?: string;

  scheduleMessages?: ScheduleMessage[];
  scheduleMessage?: ScheduleMessage;
  confirmationSetting?: ConfirmationSetting;
  sendSetting?: SendSetting;
}
