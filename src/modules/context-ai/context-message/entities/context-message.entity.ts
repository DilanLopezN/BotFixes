import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ContextMessageRole, IContextMessage } from '../interfaces/context-message.interface';

@Index(['workspaceId', 'contextId', 'referenceId'])
@Index(['workspaceId', 'createdAt'])
@Entity('context_message')
export class ContextMessage implements IContextMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'content', nullable: false })
    content: string;

    @Column({ name: 'next_step', nullable: true, type: 'jsonb' })
    nextStep: Record<string, any> | null;

    @Column({ name: 'workspace_id', nullable: false, length: 24 })
    workspaceId: string;

    @Column({ name: 'bot_id', nullable: true, length: 24 })
    botId?: string;

    @Column({ name: 'agent_id', nullable: false, length: 36 })
    agentId: string;

    @Column({ name: 'context_id', nullable: false })
    contextId: string;

    @Column({ name: 'reference_id', nullable: false })
    referenceId: string;

    @Column({ name: 'from_interaction_id', nullable: true })
    fromInteractionId?: string;

    @Column({ name: 'role', nullable: false, enum: ContextMessageRole })
    role: ContextMessageRole;

    @Column({ name: 'prompt_tokens', nullable: false, type: 'numeric' })
    promptTokens: number;

    @Column({ name: 'completion_tokens', nullable: false, type: 'numeric' })
    completionTokens: number;

    @Column({ name: 'is_fallback', nullable: false, type: 'bool', default: false })
    isFallback: boolean;

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;
}
