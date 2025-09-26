import { createContext, ReactNode, useContext, useState } from 'react';

export const tabs = {
    conversations: 'conversations',
    contacts: 'contacts',
    activities: 'activities',
};

export type ContersationContainerContextType = {
    tabFilterSelected: string;
    setTabFilterSelected: React.Dispatch<React.SetStateAction<string>>;
};

export const ContersationContainerContext = createContext<ContersationContainerContextType>({
    tabFilterSelected: tabs.conversations,
    setTabFilterSelected: () => {},
});

export const useContersationContainerContext = () => useContext(ContersationContainerContext);

export const ContersationContainerContextProvider = ({ children }: { children: ReactNode }) => {
    const [tabFilterSelected, setTabFilterSelected] = useState<string>(tabs.conversations);

    return (
        <ContersationContainerContext.Provider
            value={{
                tabFilterSelected,
                setTabFilterSelected,
            }}
        >
            {children}
        </ContersationContainerContext.Provider>
    );
};
