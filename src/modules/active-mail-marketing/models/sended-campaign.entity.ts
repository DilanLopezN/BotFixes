import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('sended_campaign')
export class SendedCampaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'short_id', type: 'varchar', length: 10, nullable: false })
    @Index()
    shortId: string;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @Column({ name: 'campaign_config_id', nullable: false })
    @Index()
    campaignConfigId: string;

    @Column({ name: 'conversation_id', type: 'varchar', nullable: true })
    conversationId?: string;

    @Column({ name: 'recipient_email', type: 'varchar', nullable: true })
    recipientEmail?: string;

    @Column({ name: 'recipient_whatsapp', type: 'varchar', nullable: true })
    recipientWhatsapp?: string;

    @Column({ name: 'recipient_attributes', type: 'jsonb', nullable: true })
    recipientAttributes?: any;

    @Column({ name: 'template_data', type: 'jsonb', nullable: true })
    templateData?: any;

    @Column({ name: 'click_count', type: 'int', default: 0 })
    clickCount: number;

    @Column({ name: 'sended_email_at', type: 'timestamp', nullable: true })
    sendedEmailAt?: Date;

    @Column({ name: 'last_click_at', type: 'timestamp', nullable: true })
    lastClickAt?: Date;

    @Column({ name: 'first_click_at', type: 'timestamp', nullable: true })
    firstClickAt?: Date;

    @Column({ name: 'expired_at', type: 'timestamp', nullable: true })
    expiredAt?: Date;

    @Column({ name: 'expired_access_at', type: 'timestamp', nullable: true })
    expiredAccessAt?: Date;

    @Column({ name: 'error', type: 'text', nullable: true })
    error?: string;

    @Column({ name: 'status', type: 'varchar', default: 'pending' })
    status: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
