import { ActivityType, IdentityType } from 'kissbot-core';
import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity()
export class ActivitySearch {
    @PrimaryColumn({ length: 24 })
    id: string;

    @Column({ name: 'conversation_id', length: 24 })
    conversationId: string;

    @Index()
    @Column({ name: 'workspace_id', length: 24 })
    workspaceId: string;

    @Column({ type: String, enum: [ActivityType.message, ActivityType.comment] })
    type: ActivityType;

    @Column({ type: String, enum: [IdentityType.agent, IdentityType.user] })
    from_type: ActivityType;

    @Column({ type: 'bigint', nullable: true })
    timestamp: number;

    @Column('tsvector', { select: false })
    text: any;
}
