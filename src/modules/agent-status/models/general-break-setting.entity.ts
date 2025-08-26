import { Column, Entity, PrimaryColumn } from 'typeorm';

export const DEFAULT_MAX_INACTIVE_DURATION_SECONDS = 7200; // 2 HORAS
export const DEFAULT_NOTIFICATION_INTERVAL_SECONDS = 600; // 10 MINUTOS
export const DEFAULT_BREAK_START_DELAY_SECONDS = 600; // 10 MINUTOS
@Entity('general_break_settings')
export class GeneralBreakSetting {
    @PrimaryColumn({ name: 'workspace_id' })
    workspaceId: string;

    @Column({ name: 'enabled', default: true })
    enabled: boolean;

    @Column({ name: 'notification_interval_seconds', default: DEFAULT_NOTIFICATION_INTERVAL_SECONDS })
    notificationIntervalSeconds: number;

    @Column({ name: 'break_start_delay_seconds', default: DEFAULT_BREAK_START_DELAY_SECONDS })
    breakStartDelaySeconds: number;

    @Column({ name: 'max_inactive_duration_seconds', default: DEFAULT_MAX_INACTIVE_DURATION_SECONDS })
    maxInactiveDurationSeconds: number;
}
