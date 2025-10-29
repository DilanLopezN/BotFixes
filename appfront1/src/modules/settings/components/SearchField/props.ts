import { CSSProperties } from "react";

interface FiltersTemplate {
    search: string;
    limit: number;
    skip: number;
    origin: string;
}

export interface SearchFieldProps {
    onChange: Function;
    filters?: FiltersTemplate;
    placeholder: string;
    autoFocus?: boolean;
    style?: CSSProperties;
}
