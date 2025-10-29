import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { FormProps } from "../../../../../interfaces/FormProps";
import { Interaction } from "../../../../../model/Interaction";

export interface FormNewInteractionReferenceProps extends FormProps, I18nProps{
    interactionList : Array<Interaction>;
    interaction : Interaction;
}