import { BotAttribute } from "../../../../model/BotAttribute";
import { I18nProps } from "../../../i18n/interface/i18n.interface";

export interface BotAttributeEditProps extends I18nProps{
  botAttribute: BotAttribute;
  onCancel: Function;
  onSave: Function;
  onDelete: Function;
  openInteraction: Function;
  addNotification: Function;
}