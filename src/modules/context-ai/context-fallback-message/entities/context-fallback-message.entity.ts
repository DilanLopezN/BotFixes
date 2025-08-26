import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IContextFallbackMessage } from '../interfaces/context-fallback-message.interface';

@Index(['workspaceId', 'createdAt'])
@Entity('context_fallback_message')
export class ContextFallbackMessage implements IContextFallbackMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id', nullable: false, length: 24 })
    workspaceId: string;

    @Column({ name: 'agent_id', nullable: true, length: 36 })
    agentId: string;

    @Column({ name: 'question', nullable: false })
    question: string;

    @Column({ name: 'context', nullable: true })
    context: string;

    @Column({ name: 'training_ids', nullable: true, type: 'jsonb' })
    trainingIds: string[];

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;
}
