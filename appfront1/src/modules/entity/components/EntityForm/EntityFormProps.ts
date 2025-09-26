import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { Entity } from "kissbot-core";
import { Workspace } from "../../../../model/Workspace";

export interface EntityFormProps extends I18nProps {
    entityCurrent: Entity;
    entitiesList: Entity[];
    setCurrentEntity: (entityId: any) => any;
    setCurrentEntities: (entityId: any) => any;
    workspaceList: Workspace[];
    setWorkspaceListNotAsync: (...params) => any;
    match?: any;
    addEntity: (entityId: any) => any;
}

export interface EntityFormState {
    isSubmitting: boolean;
    openedModalIndex: number;
    entriesList: Array<any>;
    searchEntriesValue: string;
    searchAttributesValue: string;
    showAttrs: boolean;
}
