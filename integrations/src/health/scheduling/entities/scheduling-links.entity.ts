import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ISchedulingLinks } from '../interfaces/scheduling-links.interface';

@Index(['shortId'])
@Index(['integrationId', 'patientErpCode', 'createdAt'])
@Unique(['shortId'])
@Entity({ name: 'scheduling_link' })
export class SchedulingLinks implements ISchedulingLinks {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'integration_id', length: 24, nullable: false })
  integrationId: string;

  @Column({ name: 'short_id', length: 10, nullable: false })
  shortId: string;

  @Column({ name: 'patient_erp_code', length: 100, nullable: false })
  patientErpCode: string;

  @Column({ name: 'patient_cpf', length: 40, nullable: true })
  patientCpf?: string;

  @Column({ name: 'schedule_code', length: 50, nullable: true })
  scheduleCode?: string;

  @Column({ name: 'link', length: 400, nullable: false })
  link: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;
}
