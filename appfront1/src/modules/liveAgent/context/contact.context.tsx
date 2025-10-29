import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Contact } from '../interfaces/contact.interface';

export type ContactTypeContext = {
    contactSelected: Contact | undefined;
    setContactSelected: React.Dispatch<React.SetStateAction<Contact | undefined>>;
};

export const ContactContext = createContext<ContactTypeContext>({
    contactSelected: undefined,
    setContactSelected: () => {},
});

export const useContactContext = () => useContext(ContactContext);

export const ContactContextProvider = ({ children }: { children: ReactNode }) => {
    const [contactSelected, setContactSelected] = useState<Contact | undefined>(undefined);

    const memorizedContextValue = useMemo(
        () => ({
            contactSelected,
            setContactSelected,
        }),
        [contactSelected]
    );

    return <ContactContext.Provider value={memorizedContextValue}>{children}</ContactContext.Provider>;
};
