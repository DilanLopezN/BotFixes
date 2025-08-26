import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('break_settings')
@Index('idx_break_settings_workspace', ['workspaceId'])
export class BreakSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name' })
    name: string;

    @Column({ name: 'duration_seconds' })
    durationSeconds: number;

    @Column({ name: 'enabled', default: true })
    enabled: boolean;

    @Column({ name: 'workspace_id' })
    workspaceId: string;
}
