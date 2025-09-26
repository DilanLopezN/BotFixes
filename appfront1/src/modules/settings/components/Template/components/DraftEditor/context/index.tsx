import React, { createContext, ReactNode, useContext, useRef, useState } from 'react';
import { TemplateVariable } from '../../../../../../liveAgent/components/TemplateMessageList/interface';

export type TemplateVariableContext = {
    templateVariables: TemplateVariable[];
    setTemplateVariables: React.Dispatch<React.SetStateAction<TemplateVariable[]>>;
};

export const TemplateVariableContext = createContext<TemplateVariableContext>({
    templateVariables: [],
    setTemplateVariables: () => {},
});

export const useTemplateVariableContext = () => useContext(TemplateVariableContext);

export const TemplateVariableContextProvider = ({ children }: { children: ReactNode }) => {
    const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);

    const templateVariablesRef = useRef<Pick<TemplateVariableContext, 'templateVariables' | 'setTemplateVariables'>>();
    templateVariablesRef.current = { templateVariables, setTemplateVariables };

    return (
        <TemplateVariableContext.Provider
            value={{
                templateVariables: templateVariablesRef.current.templateVariables,
                setTemplateVariables: templateVariablesRef.current.setTemplateVariables,
            }}
        >
            {children}
        </TemplateVariableContext.Provider>
    );
};