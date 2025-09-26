import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { BotResponseProps } from "../interfaces";
import { BotAttribute } from "../../../../../model/BotAttribute";
import { Entity } from "kissbot-core/lib";

export interface BotResponseSetAttributeProps extends BotResponseProps, I18nProps {
    botAttributes: Array<BotAttribute>;
    entitiesList: Array<Entity>;
    setCurrentEntities: (entitiesList: Array<Entity>) => any;
    setCurrentEntity: (entityId: any) => any;
    match?: any;
}
