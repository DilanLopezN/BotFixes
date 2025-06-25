import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['workspaceId', 'trainingEntryId'])
@Index(['workspaceId', 'createdAt'])
@Entity('executed_training')
export class ExecutedTraining {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'identifier', nullable: false, length: 180 })
    identifier: string;

    @Column({ name: 'content', nullable: false, length: 1_000 })
    content: string;

    @Column({ name: 'workspace_id', nullable: false, length: 24 })
    workspaceId: string;

    @Column({ name: 'training_entry_id', nullable: false })
    trainingEntryId: string;

    @Column({ name: 'total_tokens', nullable: false, type: 'int' })
    totalTokens: number;

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;
}
