import { I18nProps } from './../../../../../../../i18n/interface/i18n.interface';
import { BotResponseProps } from './../../../../interfaces';
import { Interaction } from './../../../../../../../../model/Interaction';

export interface BotDesignerDoctorSchedulesProps extends BotResponseProps, I18nProps {
    interactionList: Interaction[];
}