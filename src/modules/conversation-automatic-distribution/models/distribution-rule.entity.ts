import { Entity, Column, PrimaryGeneratedColumn, Index, Unique } from 'typeorm';

@Index(['workspaceId'])
@Unique(['workspaceId'])
@Entity({ name: 'distribution_rule' })
export class DistributionRule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'active', default: true })
    active: boolean;

    @Column({ name: 'max_conversations_per_agent', nullable: false })
    maxConversationsPerAgent: number;

    @Column({ name: 'check_user_was_on_conversation', default: false })
    checkUserWasOnConversation: boolean;

    @Column({ name: 'check_team_working_time_conversation', default: false })
    checkTeamWorkingTimeConversation: boolean;

    @Column({ name: 'excluded_user_ids', type: 'character varying', array: true, nullable: true })
    excludedUserIds: string[];

    @Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;
}
