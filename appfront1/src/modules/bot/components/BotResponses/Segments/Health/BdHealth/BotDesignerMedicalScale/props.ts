import { I18nProps } from './../../../../../../../i18n/interface/i18n.interface';
import { BotResponseProps } from './../../../../interfaces';
import { Interaction } from './../../../../../../../../model/Interaction';

export interface BotDesignerMedicalScaleProps extends BotResponseProps, I18nProps {
    interactionList: Interaction[];
}