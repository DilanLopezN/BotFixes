import { Contact } from '../../../../interfaces/contact.interface';

export interface ContactHistoryItemsProps {
    contact: Contact;
    onSelectConversation: (conversationId: string) => void;
    conversation?: any;
    workspaceId: string | undefined;
    getTranslation: (text?: string) => any;
}
