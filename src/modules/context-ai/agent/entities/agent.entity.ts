import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IAgent } from '../interfaces/agent.interface';

@Index(['workspaceId', 'botId'])
@Entity({ name: 'agent' })
export class Agent implements IAgent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'description', nullable: false })
    description: string;

    @Column({ name: 'prompt', type: 'text' })
    prompt: string;

    @Column({ name: 'personality', type: 'text', nullable: true })
    personality: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'bot_id', nullable: false })
    botId: string;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

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
