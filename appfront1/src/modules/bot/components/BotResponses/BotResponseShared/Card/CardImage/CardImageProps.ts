import { I18nProps } from './../../../../../../i18n/interface/i18n.interface';
import { IResponseElementImage } from "kissbot-core";

export interface CardImageProps extends I18nProps{
    imageUrl: any;
    isSubmitted: boolean;
    onChange: (card: IResponseElementImage, isValid: boolean) => any;
}

export interface CardImageState{
    isOpenedModal: boolean;
}