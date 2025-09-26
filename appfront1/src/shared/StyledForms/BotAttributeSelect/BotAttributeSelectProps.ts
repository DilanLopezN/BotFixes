import { I18nProps } from './../../../modules/i18n/interface/i18n.interface';
import { BotAttribute } from "../../../model/BotAttribute";

export interface BotAttributeSelectProps extends BotAttributeSelectExposedProps, I18nProps {
    botAttributes: BotAttribute[];
}

export interface BotAttributeSelectExposedProps{
    fieldName: string;
    onOptionSelected?: (...params) => any;
    handleChange: (...params) => any;
    handleBlur: (...params) => any;
    onBlur?: (...params) => any
}