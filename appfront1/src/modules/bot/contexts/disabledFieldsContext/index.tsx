import React, { createContext, ReactNode, useContext, useState } from 'react';

export type DisabledFieldsTypeContext = {
    disabledFields?: boolean;
    setDisabledFields: React.Dispatch<React.SetStateAction<boolean | undefined>>;
};

export const DisabledTypeContext = createContext<DisabledFieldsTypeContext>({
    disabledFields: undefined,
    setDisabledFields: () => {},
});

export const useDisabledFieldsTypeContext = () => useContext(DisabledTypeContext);

export const DisabledFieldsTypeContextProvider = ({ children }: { children: ReactNode }) => {
    const [disabledFields, setDisabledFields] = useState<boolean | undefined>(undefined);
    return (
        <DisabledTypeContext.Provider
            value={{
                disabledFields,
                setDisabledFields,
            }}
        >
            {children}
        </DisabledTypeContext.Provider>
    );
};