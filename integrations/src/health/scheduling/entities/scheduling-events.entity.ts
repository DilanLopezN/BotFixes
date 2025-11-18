import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IScheduleEvents, ScheduleEventType } from '../interfaces/scheduling-events.interface';

@Index(['integrationId', 'scheduleCode', 'createdAt'])
@Entity({ name: 'scheduling_event' })
export class SchedulingEvents implements IScheduleEvents {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'integration_id', length: 24, nullable: false })
  integrationId: string;

  @Column({ name: 'short_id', length: 10, nullable: false })
  shortId: string;

  @Column({ name: 'schedule_code', length: 50, nullable: true })
  scheduleCode?: string;

  @Column({ name: 'source', enum: ScheduleEventType, nullable: false })
  type: ScheduleEventType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;
}
