import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IntentDetection } from './intent-detection.entity';

@Entity('intent_detection_user_history')
export class IntentDetectionUserHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id', type: 'varchar' })
    workspaceId: string;

    @Column({ name: 'agent_id', nullable: true })
    agentId: string | null;

    @Column({ name: 'input_text', type: 'text' })
    inputText: string;

    @Column({ name: 'detected_intent_id', type: 'uuid', nullable: true })
    detectedIntentId: string | null;

    @Column({ name: 'detected', type: 'boolean', default: false })
    detected: boolean;

    @Column({ name: 'prompt_tokens', nullable: false, type: 'numeric' })
    promptTokens: number;

    @Column({ name: 'completion_tokens', nullable: false, type: 'numeric' })
    completionTokens: number;

    @Column({ name: 'actions_returned', type: 'jsonb', nullable: true })
    actionsReturned: string[] | null;

    @Column({ name: 'context_id', type: 'varchar', nullable: true })
    contextId?: string;

    @Column({ name: 'from_interaction_id', type: 'varchar', nullable: true })
    fromInteractionId?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => IntentDetection, { nullable: true })
    @JoinColumn({ name: 'detected_intent_id' })
    detectedIntent: IntentDetection | null;
}
