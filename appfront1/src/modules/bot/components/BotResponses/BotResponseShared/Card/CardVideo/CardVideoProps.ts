import { I18nProps } from './../../../../../../i18n/interface/i18n.interface';
import { IResponseElementVideo } from "kissbot-core";

export interface CardVideoProps extends I18nProps{
    videoUrl: any;
    isSubmitted?: boolean;
    onChange: (card: IResponseElementVideo, isValid: boolean) => any;
}

export interface CardVideoState{
    isOpenedModal: boolean;
}