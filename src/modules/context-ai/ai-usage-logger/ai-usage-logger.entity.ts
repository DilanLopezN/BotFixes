import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('ai_usage_loggers')
@Index(['workspaceId'])
@Index(['workspaceId', 'createdAt'])
@Index(['workspaceId', 'integrationId', 'createdAt'])
export class AiUsageLoggerRepository {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    integrationId?: string;

    @Column({ nullable: true })
    workspaceId?: string;

    @Column('int')
    inputTokens: number;

    @Column('int')
    outputTokens: number;

    @Column('decimal', { precision: 12, scale: 8 })
    inputCostPerTokenUSD: number;

    @Column('decimal', { precision: 12, scale: 8 })
    outputCostPerTokenUSD: number;

    @Column('text')
    inputPrompt: string;

    @Column('text')
    outputResponse: string;

    @Column()
    model: string;

    @Column()
    provider: string;

    @Column({ nullable: true })
    originModule?: string;

    @Column({ nullable: true })
    originTable?: string;

    @Column({ nullable: true })
    originRecordId?: string;

    @CreateDateColumn()
    createdAt: Date;
}
