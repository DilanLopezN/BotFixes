import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { bigint } from '../../../../common/entity-helpers';

@Index(['integrationId', 'scheduleCode'])
@Index(['integrationId', 'patientCode'])
@Index(['integrationId', 'scheduleDate'])
@Entity({
  name: 'botdesigner_fake_appointment',
  schema: 'botdesigner_fake_integration',
})
export class BotdesignerFakeAppointment {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ name: 'integration_id', length: 24 })
  integrationId: string;

  @Column({ name: 'schedule_code', unique: true })
  scheduleCode: string;

  @Column({ name: 'patient_code', nullable: true })
  patientCode?: string;

  @Column({ name: 'doctor_code', nullable: true })
  doctorCode?: string;

  @Column({ name: 'schedule_date', type: 'timestamp' })
  scheduleDate: Date;

  @Column({ name: 'duration', type: 'int', default: 30 })
  duration: number;

  @Column({ name: 'status', default: 'scheduled' })
  status: string;

  @Column({ name: 'organization_unit_code', nullable: true })
  organizationUnitCode?: string;

  @Column({ name: 'speciality_code', nullable: true })
  specialityCode?: string;

  @Column({ name: 'insurance_code', nullable: true })
  insuranceCode?: string;

  @Column({ name: 'appointment_type_code', nullable: true })
  appointmentTypeCode?: string;

  @Column({ name: 'procedure_code', nullable: true })
  procedureCode?: string;

  @Column({ name: 'type_of_service_code', nullable: true })
  typeOfServiceCode?: string;

  @Column({ name: 'insurance_plan_code', nullable: true })
  insurancePlanCode?: string;

  @Column({ name: 'insurance_category_code', nullable: true })
  insuranceCategoryCode?: string;

  @Column({ name: 'insurance_sub_plan_code', nullable: true })
  insuranceSubPlanCode?: string;

  @Column({ name: 'created_at', type: 'bigint', transformer: bigint })
  createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint', transformer: bigint })
  updatedAt: number;
}
