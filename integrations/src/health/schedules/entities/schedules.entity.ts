import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ISchedules, ScheduleStatus } from '../interfaces/schedules.interface';
import { Extractions } from './extractions.entity';

export const SCHEDULE_OVERRIDE_FIELDS = [
  'patient_name',
  'patient_code',
  'patient_cpf',
  'patient_born_date',
  'patient_phone1',
  'patient_phone2',
];

export const SCHEDULE_UNIQUE_FIELDS = [
  'schedule_code',
  'schedule_date',
  'integration_id',
  'patient_code',
  'patient_born_date',
];

@Unique(['scheduleCode', 'scheduleDate', 'integrationId', 'patientCode', 'patientBornDate'])
@Index(['integrationId', 'scheduleStatus'])
@Index(['scheduleCode'])
@Entity()
export class Schedules implements ISchedules {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'integration_id', length: 24, nullable: false })
  integrationId: string;

  @Column({ name: 'workspace_id', length: 24, nullable: false })
  workspaceId: string;

  @ManyToOne(() => Extractions)
  @JoinColumn([{ name: 'extraction_id', referencedColumnName: 'id' }])
  extraction: Extractions;

  @Column({ name: 'is_first_come_first_served', type: 'boolean', nullable: true })
  isFirstComeFirstServed?: boolean;

  // Momento em que o dado foi importado via extração via api
  @Column({ name: 'created_at', type: 'bigint', nullable: false })
  createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint', nullable: true })
  updatedAt?: number;

  @Column({ name: 'canceled_at', type: 'bigint', nullable: true })
  canceledAt?: number;

  @Column({ name: 'confirmed_at', type: 'bigint', nullable: true })
  confirmedAt?: number;

  /** Dados agendamento */
  @Column({ name: 'schedule_code', length: 60, nullable: false })
  scheduleCode: string;

  @Column({ name: 'principal_schedule_code', length: 60, nullable: true })
  principalScheduleCode: string;

  @Column({ name: 'is_principal', nullable: false, default: true })
  isPrincipal: boolean;

  @Column({ type: 'bigint', name: 'schedule_date', nullable: false })
  scheduleDate: number;

  @Column({
    type: 'smallint',
    name: 'schedule_status',
    enum: [...Object.values(ScheduleStatus)],
    nullable: false,
    default: ScheduleStatus.extracted,
  })
  scheduleStatus: ScheduleStatus;

  /** Dados entidades agendamento */

  @Column({ name: 'speciality_name', nullable: true })
  specialityName?: string;

  @Column({ name: 'speciality_code', nullable: true })
  specialityCode?: string;

  @Column({ name: 'procedure_name', nullable: true })
  procedureName?: string;

  @Column({ name: 'procedure_code', nullable: true })
  procedureCode?: string;

  @Column({ name: 'appointment_type_name', nullable: true })
  appointmentTypeName?: string;

  @Column({ name: 'appointment_type_code', nullable: true })
  appointmentTypeCode?: string;

  @Column({ name: 'insurance_name', nullable: true })
  insuranceName?: string;

  @Column({ name: 'insurance_code', nullable: true })
  insuranceCode?: string;

  @Column({ name: 'type_of_service_code', nullable: true })
  typeOfServiceCode?: string;

  @Column({ name: 'type_of_service_name', nullable: true })
  typeOfServiceName?: string;

  @Column({ name: 'insurance_plan_name', nullable: true })
  insurancePlanName?: string;

  @Column({ name: 'insurance_plan_code', nullable: true })
  insurancePlanCode?: string;

  @Column({ name: 'doctor_name', nullable: true })
  doctorName?: string;

  @Column({ name: 'doctor_code', nullable: true })
  doctorCode?: string;

  @Column({ name: 'insurance_category_name', nullable: true })
  insuranceCategoryName?: string;

  @Column({ name: 'insurance_category_code', nullable: true })
  insuranceCategoryCode?: string;

  @Column({ name: 'insurance_sub_plan_name', nullable: true })
  insuranceSubPlanName?: string;

  @Column({ name: 'insurance_sub_plan_code', nullable: true })
  insuranceSubPlanCode?: string;

  @Column({ name: 'organization_unit_name', nullable: true })
  organizationUnitName?: string;

  @Column({ name: 'organization_unit_code', nullable: true })
  organizationUnitCode?: string;

  @Column({ name: 'organization_unit_address', nullable: true })
  organizationUnitAddress?: string;

  @Column({ name: 'guidance', nullable: true })
  guidance?: string;

  @Column({ name: 'observation', nullable: true })
  observation?: string;

  // tipo de serviço (consulta, exame, cirurgia, retorno) o nome do tipo de serviço
  // não o representa, mas este campo sim
  @Column({ name: 'reference_type_of_service', nullable: true })
  referenceTypeOfService?: string;

  @Column({ name: 'reference_schedule_type', nullable: true })
  referenceScheduleType?: string;

  /** Dados paciente */
  @Column({ name: 'patient_code', length: 60, nullable: true })
  patientCode?: string;

  // Pode não existir código do paciente vinculado ao agendamento então já salvo o nome do paciente
  @Column({ name: 'patient_name', length: 200, nullable: false })
  patientName: string;

  @Column({ name: 'patient_cpf', length: 13, nullable: true })
  patientCpf?: string;

  @Column({ name: 'patient_email1', nullable: true })
  patientEmail1?: string;

  @Column({ name: 'patient_email2', nullable: true })
  patientEmail2?: string;

  @Column({ name: 'patient_phone1', nullable: true })
  patientPhone1?: string;

  @Column({ name: 'patient_phone2', nullable: true })
  patientPhone2?: string;

  @Column({ name: 'patient_born_date', nullable: true })
  patientBornDate?: string;

  @Column({ name: 'data', type: 'jsonb', nullable: true })
  data?: any;
}
