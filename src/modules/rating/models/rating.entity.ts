import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { RatingSetting } from './rating-setting.entity';

@Entity()
export class Rating {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    value?: number;

    @Column({ nullable: true, name: 'rating_feedback', length: 400 })
    ratingFeedback?: string;

    @Column({ name: 'workspace_id' })
    @Index()
    workspaceId: string;

    @Column({ name: 'conversation_id' })
    conversationId: string;

    @Column({ name: 'team_id', nullable: true })
    teamId?: string;

    @Column({ name: 'closed_id', nullable: true })
    closedBy?: string;

    @Column({ array: true, nullable: true, length: 31, type: 'varchar' })
    tags?: string|string[];

    @Column()
    channel: string;

    @Column({ name: 'setting_id' })
    @Index()
    settingId: number;

    @Column({ name: 'created_at', type: 'bigint' })
    createdAt: number;

    @Column({ name: 'accessed_at', type: 'bigint', nullable: true })
    accessedAt?: number;

    @Column({ name: 'exit_at', type: 'bigint', nullable: true })
    exitAt?: number;

    @Column({ name: 'rating_at', type: 'bigint', nullable: true })
    ratingAt?: number;

    @Column({ name: 'expires_at', type: 'bigint', nullable: true })
    expiresAt?: number;

    @Column({ name: 'rating_sended_at', type: 'bigint', nullable: true })
    ratingSendedAt?: number;

    @Column({ name: 'url_identifier', nullable: false })
    urlIdentifier?: string;

    setting?: RatingSetting;
}
