import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { InteractionPendingProps } from '../../components/interaction-pending';

export type InteractionsPendingPublicationType = {
    interactionsPendingPublication: any[];
    setInteractionsPendingPublication: React.Dispatch<React.SetStateAction<any[]>>;
};

export const InteractionsPendingPublicationContext = createContext<InteractionsPendingPublicationType>({
    interactionsPendingPublication: [],
    setInteractionsPendingPublication: () => {},
});

export const useInteractionsPendingPublicationContext = () => useContext(InteractionsPendingPublicationContext);

export const InteractionsPendingPublicationContextProvider = ({
    children,
    value,
}: {
    children: ReactNode;
    value: InteractionPendingProps[];
}) => {
    const [interactionsPendingPublication, setInteractionsPendingPublication] = useState<InteractionPendingProps[]>(
        value || []
    );

    useEffect(() => {
        setInteractionsPendingPublication(value);
    }, [value]);

    return (
        <InteractionsPendingPublicationContext.Provider
            value={{
                interactionsPendingPublication,
                setInteractionsPendingPublication,
            }}
        >
            {children}
        </InteractionsPendingPublicationContext.Provider>
    );
};
