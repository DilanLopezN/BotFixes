import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GupshupIdHash {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'conversation_id', nullable: true })
    conversationId?: string;

    @Column({ name: 'workspace_id', nullable: true })
    workspaceId?: string;

    @Column({ name: 'hash' })
    @Index({ unique: true })
    hash: string;

    @Column({ name: 'gs_id' })
    @Index({ unique: true })
    gsId: string;

    @Column({ type: 'bigint', name: 'created_at' })
    createdAt: number;
}
