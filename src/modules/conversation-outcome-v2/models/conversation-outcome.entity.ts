import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['id', 'workspaceId'])
export class ConversationOutcome {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text', { array: true, name: 'tags', nullable: true })
    tags?: string[];

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ type: 'bigint', name: 'created_at', nullable: false })
    createdAt: number;

    @Column({ type: 'bigint', name: 'updated_at', nullable: true })
    updatedAt?: number;

    @Column({ type: 'bigint', name: 'deleted_at', nullable: true })
    deletedAt?: number;
}
