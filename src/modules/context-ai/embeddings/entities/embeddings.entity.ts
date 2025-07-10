import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['workspaceId', 'createdAt'])
@Entity('embeddings')
export class Embeddings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'training_entry_id', nullable: false, unique: true })
    trainingEntryId: string;

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;

    @Column({ name: 'updated_at', nullable: false, type: 'timestamp without time zone' })
    updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: false, type: 'timestamp without time zone' })
    deletedAt: Date;

    @Column({ name: 'workspace_id', nullable: false, length: 24 })
    workspaceId: string;

    @Column({ name: 'total_tokens', nullable: false, type: 'int' })
    totalTokens: number;

    // @ts-ignore TypeORM does not support but the database supports
    @Column({ name: 'embedding', type: 'vector', nullable: false })
    embedding: number[];
}
