import { BotResponseProps } from './../interfaces';
import { I18nProps } from './../../../../i18n/interface/i18n.interface';

export interface BotResponseQuestionProps extends BotResponseProps, I18nProps {
    botAttributes: any;
}