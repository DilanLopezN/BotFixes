import { I18nProps } from './../../modules/i18n/interface/i18n.interface';

export interface SearchBarProps extends I18nProps {
    onSearch: (...params) => void;
    placeholder?: string;
};
