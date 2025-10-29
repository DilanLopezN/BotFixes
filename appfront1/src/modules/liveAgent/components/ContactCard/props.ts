import { ContactSearchResult } from '../../interfaces/contact.interface';

export interface ContactCardProps {
    contact: ContactSearchResult;
    setContactSelected: (args: any) => any;
    contactSelected: any;
}
