import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ContextVariableType, IContextVariable } from '../interfaces/context-variables.interface';

@Index(['workspaceId', 'agentId', 'contextId'])
@Unique(['workspaceId', 'agentId', 'name'])
@Entity('context_variable')
export class ContextVariable implements IContextVariable {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'name', nullable: false, length: 100 })
    name: string;

    @Column({ name: 'value', nullable: false, length: 1_000 })
    value: string;

    @Column({ name: 'workspace_id', nullable: false, length: 24 })
    workspaceId: string;

    @Column({ name: 'context_id', nullable: true, length: 24 })
    contextId?: string;

    @Column({ name: 'agent_id', nullable: false, length: 36 })
    agentId: string;

    @Column({ name: 'type', nullable: false, length: 24, enum: ContextVariableType })
    type: ContextVariableType;

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;

    @Column({ name: 'updated_at', nullable: true, type: 'timestamp without time zone' })
    updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: true, type: 'timestamp without time zone' })
    deletedAt: Date;
}
