export interface I18nProps {
    getTranslation: (text?: string) => string;
    getArray: (texts: string[]) => GetArrayWords;
}

export interface Words {
    [word: string]: {
        pt: string,
        en: string,
    }
}

export enum Languages {
    pt = 'Portuguese',
    en = 'English'
}

export interface GetArrayWords {
    [key: string]: string;
}