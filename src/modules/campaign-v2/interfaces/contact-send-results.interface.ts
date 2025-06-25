import { Contact } from '../../campaign/models/contact.entity';

export interface ContactSendResult {
    contact: Contact;
    result: {
        success: boolean;
        message: string;
    };
}
