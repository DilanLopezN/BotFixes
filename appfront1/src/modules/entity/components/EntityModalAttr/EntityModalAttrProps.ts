import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { EntityAttribute } from "kissbot-core";

export interface EntityModalAttrProps extends I18nProps {
    onChange: (params: Array<EntityAttribute>) => any;
    schemas?: Array<EntityAttribute>;
}
export interface EntityModalAttrState {
    isModalOpened: boolean;
    attrsSaved: boolean;
}