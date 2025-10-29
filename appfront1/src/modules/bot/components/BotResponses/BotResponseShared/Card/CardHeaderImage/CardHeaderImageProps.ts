import { I18nProps } from './../../../../../../i18n/interface/i18n.interface';

export interface CardHeaderImageProps extends I18nProps {
    onChange: (...params) => any;
    media: any;
}

export interface CardHeaderImageState {
    isOpenedModal: boolean;
}