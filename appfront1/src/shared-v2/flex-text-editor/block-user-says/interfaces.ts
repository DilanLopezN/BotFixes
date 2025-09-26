interface Option {
    value: string;
    label: string;
}

export interface TranslatedOptions {
    systemOptions: Option[];
    customOptions: Option[];
}
