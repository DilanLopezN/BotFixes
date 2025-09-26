import { IResponseElementWhatsappFlow } from 'kissbot-core';
import { I18nProps } from './../../../../../i18n/interface/i18n.interface';
import { BotAttribute } from '../../../../../../model/BotAttribute';

export interface FlowCardProps extends I18nProps {
    flowCard: IResponseElementWhatsappFlow;
    isSubmitted: boolean;
    onChange: (flowCard: IResponseElementWhatsappFlow, isValid: boolean) => any;
    botAttributes?: BotAttribute[];
}
