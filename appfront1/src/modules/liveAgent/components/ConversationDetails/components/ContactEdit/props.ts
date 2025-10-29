import { Contact } from '../../../../interfaces/contact.interface';
import { I18nProps } from './../../../../../i18n/interface/i18n.interface';

export interface ContactEditProps extends I18nProps {
    contact: Contact;
    onCreate: (contact: Contact) => void;
    onCancel: () => void;
    workspaceId: string;
}
