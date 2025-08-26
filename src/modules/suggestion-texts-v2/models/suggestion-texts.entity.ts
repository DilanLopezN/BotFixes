import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { SuggestionMessageType } from '../interfaces/suggestion-texts.interface';

@Entity()
@Index(['id', 'workspaceId'])
export class SuggestionTexts {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'prompt_tokens', nullable: false, type: 'numeric' })
    promptTokens: number;

    @Column({ name: 'completion_tokens', nullable: false, type: 'numeric' })
    completionTokens: number;

    @Column({ name: 'prompt', nullable: true })
    prompt: string;

    @Column({ name: 'completion', nullable: true })
    completion: string;

    @Column({ name: 'type', enum: SuggestionMessageType, nullable: false })
    type: SuggestionMessageType;

    @Column({ name: 'model', nullable: false })
    model: string;

    @Column({ name: 'cost', nullable: false, type: 'decimal', precision: 10, scale: 5 })
    cost: number;

    @CreateDateColumn({ name: 'created_at', nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: true })
    updatedAt?: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
