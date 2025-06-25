import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['conversationId', 'objectiveId', 'outcomeId', 'userId', 'teamId', 'description', 'conversationTags', 'createdAt'])
export class ConversationCategorization {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'iid', nullable: false })
    iid: string;

    @Column({ name: 'conversation_id', nullable: false })
    conversationId: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'objective_id', nullable: true })
    objectiveId?: number;

    @Column({ name: 'outcome_id', nullable: true })
    outcomeId?: number;

    @Column({ name: 'user_id', nullable: false })
    userId: string;

    @Column({ name: 'team_id', nullable: false })
    teamId: string;

    @Column({
        name: 'description',
        type: 'varchar',
        length: 1000,
        nullable: true,
    })
    description?: string;

    @Column('text', { array: true, name: 'conversation_tags', nullable: true })
    conversationTags?: string[];

    @Column({
        type: 'bigint',
        name: 'created_at',
        nullable: false,
        transformer: {
            to: (value: number) => value, // Armazena como número no banco
            from: (value: string) => Number(value), // Converte de string para número ao carregar
        },
    })
    createdAt: number;

    @Column({ type: 'bigint', name: 'updated_at', nullable: true })
    updatedAt?: number;

    @Column({ type: 'bigint', name: 'deleted_at', nullable: true })
    deletedAt?: number;
}
