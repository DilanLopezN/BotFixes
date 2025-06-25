import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EmailType } from '../interfaces/email.interface';

@Entity()
export class Email {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'from_email', nullable: false })
    fromEmail: string;

    @Column({ name: 'from_title', nullable: false })
    fromTitle: string;

    @Column({ name: 'to', nullable: false })
    to: string;

    @Column({ name: 'subject', nullable: false })
    subject: string;

    @Column({ name: 'content', nullable: true })
    content?: string;

    @Column({ name: 'template_id', nullable: true })
    templateId?: string;

    @Column({ name: 'external_id', nullable: true })
    externalId?: string;

    @Column({ name: 'type', default: EmailType.simple, enum: EmailType, nullable: true })
    type?: EmailType;

    @Column({ type: 'timestamp with time zone', name: 'created_at', nullable: false })
    createdAt: Date;
}
