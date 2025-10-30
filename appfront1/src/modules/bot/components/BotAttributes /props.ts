import { I18nProps } from "../../../i18n/interface/i18n.interface";
import { Interaction } from "../../../../model/Interaction";

export interface BotAttributesProps extends I18nProps{
  match?: any;
  setCurrentInteraction: Function;
  setValidateInteraction: Function;
  currentInteraction: Interaction;
  validateInteraction: Interaction;
  search: string;
  
}
