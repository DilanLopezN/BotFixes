import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AgentMode, AgentContext, IAgent } from '../interfaces/agent.interface';

export enum AgentType {
    REPORT_PROCESSOR_DETECTION = 'report_processor_detection',
    RAG = 'rag',
    ENTITIES_DETECTION = 'entities_detection',
    CONFIRMATION_DETECTION = 'confirmation_detection',
    CONVERSATIONAL = 'conversational',
}

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

    @Column({
        name: 'agent_type',
        type: 'enum',
        enum: AgentType,
    })
    agentType: AgentType;

    @Column({
        name: 'agent_mode',
        type: 'enum',
        enum: AgentMode,
        default: null,
        nullable: true,
    })
    agentMode: AgentMode;

    @Column({
        name: 'agent_context',
        type: 'enum',
        enum: AgentContext,
        default: null,
        nullable: true,
    })
    agentContext: AgentContext | null;

    @Column({ name: 'model_name', nullable: true })
    modelName: string;

    @Column({ name: 'integration_id', nullable: true })
    integrationId: string;

    @Column({ name: 'allow_send_audio', default: false })
    allowSendAudio: boolean;

    @Column({ name: 'allow_response_welcome', default: false })
    allowResponseWelcome: boolean;

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
