import { Entity } from "kissbot-core";
import { Workspace } from "../../../../model/Workspace";
import { I18nProps } from "../../../i18n/interface/i18n.interface";

export interface EntitiesListProps extends I18nProps {
    setCurrentEntities: (entitiesList: Array<Entity>) => any;
    setCurrentEntity: (entityId: any) => any;
    removeEntity: (entityId: any) => any;
    entitiesList: Array<Entity>;
    entityCurrent: Entity;
    match?: any;
    selectedWorkspace?: Workspace;
    search: string;
}

export interface EntitiesListState {
    isOpenedModalDelete: boolean;
    isDeleting: boolean;
    entitiesSearchList: Array<Entity>;
}