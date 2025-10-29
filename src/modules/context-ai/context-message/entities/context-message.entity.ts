import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ContextMessageRole, ContextMessageType, IContextMessage } from '../interfaces/context-message.interface';

@Index(['workspaceId', 'contextId', 'referenceId', 'agentId'])
@Entity('context_message')
export class ContextMessage implements IContextMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'content', nullable: true })
    content: string;

    @Column({ name: 'next_step', nullable: true, type: 'jsonb' })
    nextStep: Record<string, any> | null;

    @Column({ name: 'workspace_id', nullable: true, length: 24 })
    workspaceId: string;

    @Column({ name: 'agent_id', nullable: true, length: 36 })
    agentId: string;

    @Column({ name: 'context_id', nullable: true })
    contextId: string;

    @Column({ name: 'reference_id', nullable: true })
    referenceId: string;

    @Column({ name: 'from_interaction_id', nullable: true })
    fromInteractionId?: string;

    @Column({ name: 'model_name', nullable: true })
    modelName: string;

    @Column({ name: 'role', nullable: false, enum: ContextMessageRole })
    role: ContextMessageRole;

    @Column({ name: 'type', nullable: true, enum: ContextMessageType })
    type: ContextMessageType;

    @Column({ name: 'prompt_tokens', nullable: false, type: 'numeric' })
    promptTokens: number;

    @Column({ name: 'completion_tokens', nullable: true, type: 'numeric' })
    completionTokens: number;

    @Column({ name: 'is_fallback', nullable: true, type: 'bool', default: false })
    isFallback: boolean;

    @Column({ name: 'created_at', nullable: true, type: 'timestamp without time zone' })
    createdAt: Date;
}
