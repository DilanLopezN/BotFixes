import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IIntentDetection } from '../interfaces/intent-detection.interface';

@Index(['workspaceId', 'agentId'])
@Entity({ name: 'intent_detection' })
export class IntentDetection implements IIntentDetection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'description', nullable: false })
    description: string;

    @Column({ name: 'examples', type: 'jsonb', nullable: false })
    examples: string[];

    @Column({ name: 'agent_id', nullable: false })
    agentId: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date;
}
