import { TemplateMessage } from './template-message.interface';

export interface TemplateMessageHistory extends TemplateMessage {
    updatedByUserId: string;
    templateMessageId: string;
}
