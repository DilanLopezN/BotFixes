import { Column, Entity, Index, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('conversation_trace')
@Index(['workspaceId', 'agentId', 'contextId', 'createdAt'])
export class ConversationTraceEntity {
    @PrimaryColumn({ type: 'uuid' })
    traceId: string;

    @Column({ name: 'context_id' })
    @Index()
    contextId: string;

    @Column({ name: 'workspace_id' })
    @Index()
    workspaceId: string;

    @Column({ name: 'agent_id' })
    @Index()
    agentId: string;

    @Column({ name: 'user_message', type: 'text' })
    userMessage: string;

    @Column({ name: 'final_response', type: 'text', nullable: true })
    finalResponse: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column({ name: 'start_time', type: 'timestamptz' })
    startTime: Date;

    @Column({ name: 'end_time', type: 'timestamptz', nullable: true })
    endTime: Date | null;

    @Column({ name: 'duration_ms', type: 'integer', nullable: true })
    durationMs: number | null;

    @Column({ name: 'processors', type: 'jsonb' })
    processors: any[];

    @Column({ name: 'metadata', type: 'jsonb' })
    metadata: {
        debugMode: boolean;
        totalProcessorsExecuted: number;
        totalProcessorsSkipped: number;
        hasErrors: boolean;
        errors?: string[];
        responseSource?: string;
        responseType?: string;
        tags?: string[];
    };

    @Column({ name: 'response_source', nullable: true })
    @Index()
    responseSource: string | null;

    @Column({ name: 'has_errors', default: false })
    @Index()
    hasErrors: boolean;

    @Column({ name: 'total_processors_executed', default: 0 })
    totalProcessorsExecuted: number;

    @Column({ name: 'total_processors_skipped', default: 0 })
    totalProcessorsSkipped: number;
}
