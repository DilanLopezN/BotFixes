import { EmailEventStatus } from '../models/email-event.entity';

export class SendgridEmailStatusDto {
    email: string;
    emailId: number;
    timestamp: number;
    'smtp-id': string;
    event: EmailEventStatus;
    category: Array<String>;
    sg_event_id: string;
    sg_message_id: string;
    response?: string;
    attempt?: string;
    useragent?: string;
    ip?: string;
    url?: string;
    reason?: string;
    status?: string;
}
