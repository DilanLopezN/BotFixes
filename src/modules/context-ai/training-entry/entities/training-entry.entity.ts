import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ITrainingEntry } from '../interfaces/training-entry.interface';

@Index(['workspaceId', 'agentId'])
@Entity('training_entry')
export class TrainingEntry implements ITrainingEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'identifier', nullable: false, length: 180 })
    identifier: string;

    @Column({ name: 'content', nullable: false, length: 1_000 })
    content: string;

    @Column({ name: 'workspace_id', nullable: false, length: 24 })
    workspaceId: string;

    @Column({ name: 'pending_training', nullable: true })
    pendingTraining: boolean;

    @Column({ name: 'executed_training_at', nullable: true, type: 'timestamp without time zone' })
    executedTrainingAt: Date;

    @Column({ name: 'agent_id', nullable: false, length: 36 })
    agentId: string;

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;

    @Column({ name: 'updated_at', nullable: true, type: 'timestamp without time zone' })
    updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: true, type: 'timestamp without time zone' })
    deletedAt: Date;
}
