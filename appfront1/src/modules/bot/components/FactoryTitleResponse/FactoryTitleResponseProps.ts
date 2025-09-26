import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { IResponse } from "../../../../model/Interaction";

export interface FactoryTitleResponseProps extends I18nProps {
  response: IResponse;
  settings: any;
}