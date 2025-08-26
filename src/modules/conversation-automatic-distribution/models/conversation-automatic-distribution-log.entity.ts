import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('conversation_automatic_distribution_log')
@Index(['conversationId', 'workspaceId', 'teamId'])
export class ConversationAutomaticDistributionLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'conversation_id', nullable: false })
    conversationId: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'team_id', nullable: false })
    teamId: string;

    @Column({ name: 'order', type: 'numeric', nullable: false })
    order: number;

    @Column({ name: 'priority', type: 'numeric', nullable: false })
    priority: number;

    @Column({ name: 'assigned_agent_id', nullable: false })
    assignedAgentId: string;

    @Column({ name: 'assigned_agent_name', nullable: false })
    assignedAgentName: string;

    @Column({ name: 'executed_rules', type: 'text', array: true, nullable: false })
    executedRules: string[];

    @Column({ name: 'assignment_data', type: 'jsonb', nullable: true })
    assignmentData: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
