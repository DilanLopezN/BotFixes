import { EmailEventStatus } from '../models/email-event.entity';

export interface Email {
    id: number;
    fromEmail: string;
    fromTitle: string;
    to: string;
    subject: string;
    content?: string;
    templateId?: string;
    text?: string;
    html?: string;
    type?: EmailType;
    createdAt: string;
}

export interface EmailEvents {
    id: number;
    emailId: number;
    status: EmailEventStatus;
    createdAt: string;
}

export enum EmailType {
    simple = 'simple',
    invite = 'invite',
}
