import { User } from 'kissbot-core';
import { Contact } from '../../../../interfaces/contact.interface';
import { I18nProps } from './../../../../../i18n/interface/i18n.interface';

export interface ContactInfoProps extends I18nProps {
    contact: Contact;
    conversation: any;
    workspaceId: string;
    onOpenConversation: (conversationId: string) => void;
    readingMode: boolean;
    updateContact: (contact: Contact) => void;
    conversationDisabled: boolean;
    loggedUser: User;
}
