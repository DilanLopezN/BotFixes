import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { enUs } from './locales/en-us';
import { ptBr } from './locales/pt-br';
import { generateLocaleKeys } from './generate-locale-keys';

const defaultLanguage = 'pt';

export const resources = {
  pt: ptBr,
  en: enUs,
};

export const localeKeys = generateLocaleKeys(resources[defaultLanguage].translations);

i18next.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  defaultNS: 'translations',
  interpolation: {
    escapeValue: false,
    format: (value, format, lng) => {
      if (format === 'intlDate') {
        return new Intl.DateTimeFormat('pt-BR').format(value);
      }

      return value;
    },
  },
});

export const i18n = i18next;
