import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { Workspace } from "../../../../model/Workspace";
import { Entity } from "kissbot-core/lib";
import { RouteComponentProps } from "react-router";

export interface EntityCreateProps extends RouteComponentProps, I18nProps {
    entityCurrent: Entity;
    entitiesList: Entity[];
    setCurrentEntity: (entityId: any) => any;
    setCurrentEntities: (entityId: any) => any;
    selectedWorkspace: Workspace;
    workspaceList: Workspace[];
    setWorkspaceListNotAsync: (...params) => any;
    setSelectedWorkspace: (workspace: Workspace) => any;
}

export interface EntityState {
    openModalImport: boolean;
}
