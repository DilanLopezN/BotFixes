import { Entity } from 'kissbot-core';
import { Workspace } from '../../../../../../model/Workspace';

export interface ModalImportEntityProps {
    modalOpen: boolean;
    entityCurrent: Entity;
    workspaceList: Workspace[];
    setCurrentEntity: (entity: any) => any;
    closeModal: () => any;
    getTranslation: (text) => string;
}

export interface ModalImportEntityState {
    entityList: Entity[] | undefined;
    workspaceId: string;
    entitySelected: Entity | undefined;
}
