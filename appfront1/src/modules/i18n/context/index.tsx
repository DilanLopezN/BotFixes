import { createContext, ReactNode, useContext, useEffect } from 'react';
import moment from 'moment';
import store from '../../../redux/store';
import { Languages } from '../interface/i18n.interface';
import { UserLanguage } from 'kissbot-core';
import setHighchartsLang from '../../dashboard/components/HighchartsLang';
import { wordsList } from '../components/i18nMap';

type LanguageContextType = {
    getTranslation: (key: string) => string;
};

export const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export const useLanguageContext = () => useContext(LanguageContext);

export const LanguageContextProvider = ({ children }: { children: ReactNode }) => {
    const state: any = store.getState();
    const language = state.loginReducer?.loggedUser?.language || UserLanguage.pt;

    useEffect(() => {
        if (!!language && Languages[language]) {
            if (language === UserLanguage.pt) {
                moment.locale('pt-br');
            } else {
                moment.locale('en');
            }

            setHighchartsLang(language);
        }
    }, [language]);

    const getTranslation = (key: string) => {
        return wordsList[key]?.[language] || key;
    };

    return <LanguageContext.Provider value={{ getTranslation }}>{children}</LanguageContext.Provider>;
};
