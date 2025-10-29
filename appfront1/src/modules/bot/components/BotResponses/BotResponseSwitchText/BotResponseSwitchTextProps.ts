import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { BotResponseProps } from "../interfaces";
import { BotAttribute } from "../../../../../model/BotAttribute";
import { Workspace } from "../../../../../model/Workspace";
import { Entity } from "kissbot-core";
import { IResponseElementSwitchText } from "kissbot-core/lib";

export interface BotResponseSwitchTextProps extends BotResponseProps, I18nProps {
    botAttributes: BotAttribute[];
    selectedWorkspace: Workspace;
    setCurrentEntities: (entitiesList: Array<Entity>) => any;
    setCurrentEntity: (entityId: any) => any;
    entitiesList: Array<Entity>;
    match?: any;
}

export interface BotResponseSwitchTextState extends IResponseElementSwitchText {
    type: string;
}