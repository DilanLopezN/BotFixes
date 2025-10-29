import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('incoming_requests')
export class IncomingRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'request_id', type: 'uuid', nullable: false })
    @Index()
    requestId: string;

    @Column({ name: 'campaign_id', type: 'varchar', nullable: false })
    @Index()
    campaignId: string;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @Column({ name: 'recipients', type: 'jsonb', nullable: false })
    recipients: any[];

    @Column({ name: 'template_attributes', type: 'jsonb', nullable: true })
    templateAttributes?: any;

    @Column({ name: 'conversation_attributes', type: 'jsonb', nullable: true })
    conversationAttributes?: any;

    @Column({ name: 'status', type: 'varchar', default: 'pending' })
    status: string;

    @Column({ name: 'processed_count', type: 'int', default: 0 })
    processedCount: number;

    @Column({ name: 'error_count', type: 'int', default: 0 })
    errorCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
    processedAt?: Date;
}
