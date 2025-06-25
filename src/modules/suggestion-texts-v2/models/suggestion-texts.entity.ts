import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { SuggestionMessageType } from '../interfaces/suggestion-texts.interface';

@Entity()
@Index(['id', 'workspaceId'])
export class SuggestionTexts {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'message', nullable: false })
    message: string;

    @Column('text', { array: true, name: 'suggestions', nullable: false })
    suggestions: string[];

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'prompt_tokens', nullable: false, type: 'numeric' })
    promptTokens: number;

    @Column({ name: 'completion_tokens', nullable: false, type: 'numeric' })
    completionTokens: number;

    @Column({ name: 'type', enum: SuggestionMessageType, nullable: false })
    type: SuggestionMessageType;

    @Column({ name: 'model', nullable: false })
    model: string;

    @Column({ name: 'cost', nullable: false, type: 'decimal', precision: 10, scale: 5 })
    cost: number;

    @Column({ type: 'bigint', name: 'created_at', nullable: false })
    createdAt: number;

    @Column({ type: 'bigint', name: 'updated_at', nullable: true })
    updatedAt?: number;

    @Column({ type: 'bigint', name: 'deleted_at', nullable: true })
    deletedAt?: number;
}
