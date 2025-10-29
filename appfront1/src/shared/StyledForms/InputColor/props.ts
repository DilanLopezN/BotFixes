import { I18nProps } from "../../../modules/i18n/interface/i18n.interface";

export interface InputColorProps extends I18nProps{
  name: string;
  value: string;
  onChange: Function;
  onBlur: Function;
}