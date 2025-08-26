import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IntentDetection } from './intent-detection.entity';
import { ActionType } from '../enums/action-type.enum';

@Entity('intent_actions')
export class IntentActions {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'intent_id', type: 'uuid' })
    intentId: string;

    @Column({ name: 'action_type', type: 'enum', enum: ActionType })
    actionType: ActionType;

    @Column({ name: 'target_value', type: 'text' })
    targetValue: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => IntentDetection, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'intent_id' })
    intent: IntentDetection;
}
