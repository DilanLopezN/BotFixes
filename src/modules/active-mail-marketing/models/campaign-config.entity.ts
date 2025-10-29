import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('campaign_configs')
export class CampaignConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'name', type: 'varchar', length: 120, nullable: false })
    name: string;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @Column({ name: 'start_at', type: 'timestamp', nullable: false })
    startAt: Date;

    @Column({ name: 'end_at', type: 'timestamp', nullable: false })
    endAt: Date;

    @Column({ name: 'api_token', type: 'text', nullable: false })
    apiToken: string;

    @Column({ name: 'link_message', type: 'varchar', length: 500, nullable: false })
    linkMessage: string;

    @Column({ name: 'link_ttl_minutes', type: 'int', nullable: false, default: 60 })
    linkTtlMinutes: number;

    @Column({ name: 'email_template_id', type: 'varchar', nullable: false })
    emailTemplateId: string;

    @Column({ name: 'clinic_whatsapp', type: 'varchar', nullable: false })
    clinicWhatsapp: string;

    @Column({ name: 'from_title', type: 'varchar', nullable: false, default: 'Atend Clinic' })
    fromTitle: string;

    @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
