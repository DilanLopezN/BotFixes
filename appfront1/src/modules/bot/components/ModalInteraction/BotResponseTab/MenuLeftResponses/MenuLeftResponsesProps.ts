import {Language} from "../../../../../../model/Interaction";
import { Provider } from '../../../../../../model/Provider';
import { I18nProps } from "../../../../../i18n/interface/i18n.interface";

export interface MenuLeftResponsesProps extends  I18nProps{
    onChangeLanguage: (languages : Array<Language>) => any;
    settings: any;
}
export interface MenuLeftResponsesState{
    selectedProvider: Provider;
}
