import { Interaction } from './../../../../../../../../model/Interaction';
import { I18nProps } from './../../../../../../../i18n/interface/i18n.interface';
import { BotResponseProps } from './../../../../interfaces';

export interface BotDesignerCheckAccountProps extends BotResponseProps, I18nProps {
    interactionList: Interaction[];
}
