import React, { createContext, ReactNode, useContext, useState } from 'react';
import { HealthIntegration } from '../../model/Integrations';

export type IntegrationContextType = {
    integrations: HealthIntegration[];
    setIntegrations: React.Dispatch<React.SetStateAction<HealthIntegration[]>>;
    selectedIntegration: HealthIntegration | undefined;
    setSelectedIntegration: React.Dispatch<React.SetStateAction<HealthIntegration | undefined>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export const IntegrationContext = createContext<IntegrationContextType>({
    integrations: [],
    setIntegrations: () => { },
    selectedIntegration: undefined,
    setSelectedIntegration: () => { },
    isLoading: false,
    setIsLoading: () => { },
});

export const useIntegrationContext = () => useContext(IntegrationContext);

export const IntegrationContextProvider = ({ children }: { children: ReactNode }) => {
    const [integrations, setIntegrations] = useState<HealthIntegration[]>([]);
    const [selectedIntegration, setSelectedIntegration] = useState<HealthIntegration | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    return (
        <IntegrationContext.Provider
            value={{
                integrations,
                setIntegrations,
                selectedIntegration,
                setSelectedIntegration,
                isLoading,
                setIsLoading,
            }}
        >
            {children}
        </IntegrationContext.Provider>
    );
};
