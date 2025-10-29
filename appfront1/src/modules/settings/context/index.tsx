import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { SearchFilters } from '../interfaces/search-filters.interface';

export type TemplateTypeContext = {
    selectedFilter: SearchFilters;
    setSelectedFilter: React.Dispatch<React.SetStateAction<SearchFilters>>;
};

export const TemplateTypeContext = createContext<TemplateTypeContext>({
    selectedFilter: {
        search: '',
        skip: 0,
        limit: 10,
        origin: '',
        filter: {},
    },
    setSelectedFilter: () => {},
});

export const useTemplateTypeContext = () => useContext(TemplateTypeContext);

export const TemplateTypeContextProvider = ({ children }: { children: ReactNode }) => {
    const [selectedFilter, setSelectedFilter] = useState<SearchFilters>({
        search: '',
        skip: 0,
        limit: 10,
        origin: '',
        filter: {},
    });

    return (
        <TemplateTypeContext.Provider
            value={{
                selectedFilter,
                setSelectedFilter,
            }}
        >
            {children}
        </TemplateTypeContext.Provider>
    );
};
