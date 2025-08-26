import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['conversationId', 'workspaceId', 'teamId'])
export class ConversationAutomaticDistribution {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'conversation_id', nullable: false })
    conversationId: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'team_id', nullable: false })
    teamId: string;

    @Column({ name: 'state', nullable: false })
    state: string;

    @Column({ name: 'order', type: 'numeric', nullable: false })
    order: number;

    @Column({ name: 'priority', type: 'numeric', nullable: false })
    priority: number;

    @Column({ name: 'has_member', type: 'boolean', nullable: false })
    hasMember: boolean;

    @Column({ type: 'timestamp', name: 'created_at', nullable: true })
    createdAt: Date;
}
