import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EmailType } from '../interfaces/email.interface';

@Entity()
export class EmailSendingSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'enabled', nullable: false, type: 'boolean' })
    enabled: boolean;

    @Column({ name: 'setting_name', nullable: false })
    settingName: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'template_id', nullable: false })
    templateId: string;

    @Column({ name: 'version_id', nullable: false })
    versionId: string;

    @Column({ name: 'email_type', enum: EmailType, default: EmailType.simple })
    emailType?: EmailType;

    @Column({ type: 'jsonb', name: 'template_variables', nullable: true })
    templateVariables?: Record<string, string>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}
