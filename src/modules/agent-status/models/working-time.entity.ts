import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { WorkingTimeType } from '../interfaces/working-time.interface';

// Criar também o indice em sql, pois o typeorm nao cria este indice com o GIN
// CREATE INDEX idx_working_time_team_ids_gin ON working_time USING GIN (team_ids);
@Entity('working_time')
@Index('idx_working_time_workspace_user', ['workspaceId', 'userId'])
@Index('idx_working_time_started_at', ['startedAt'])
@Index('idx_workspace_type_started', ['workspaceId', 'type', 'startedAt'])
export class WorkingTime {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'user_id', nullable: false })
    userId: string;

    @Column({ name: 'team_ids', nullable: true, type: 'text', array: true })
    teamIds?: string[];

    @Column({ name: 'type', type: 'enum', enum: WorkingTimeType, nullable: false })
    type: WorkingTimeType;

    @Column({ name: 'started_at', type: 'bigint', nullable: false })
    startedAt: number;

    @Column({ name: 'ended_at', type: 'bigint', nullable: true })
    endedAt?: number;

    @Column({ name: 'duration_in_seconds', nullable: true })
    durationInSeconds?: number;

    @Column({ name: 'break_overtime_seconds', nullable: true })
    breakOvertimeSeconds?: number;

    @Column({ name: 'justification', nullable: true })
    justification?: string;

    @Column({ name: 'context_break_changed_by_user_id', nullable: true })
    breakChangedByUserId?: string;

    @Column({ name: 'context_break_changed_by_user_name', nullable: true })
    breakChangedByUserName?: string;

    @Column({ name: 'context_duration_seconds', nullable: true })
    contextDurationSeconds?: number;

    @Column({ name: 'context_max_inactive_duration_seconds', nullable: true })
    contextMaxInactiveDurationSeconds?: number;

    @Column({ name: 'break_setting_id', nullable: true })
    breakSettingId?: number;
}
