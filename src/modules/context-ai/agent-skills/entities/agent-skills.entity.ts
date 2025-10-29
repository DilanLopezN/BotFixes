import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export interface IAgentSkills {
    id: string;
    name: string;
    description: string;
    prompt: string;
    workspaceId: string;
    agentId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

@Index(['workspaceId', 'agentId'])
@Entity({ name: 'agent_skills' })
export class AgentSkills implements IAgentSkills {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'description', nullable: true })
    description: string;

    @Column({ name: 'prompt', nullable: true })
    prompt: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'agent_id', nullable: false })
    agentId: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;
}
