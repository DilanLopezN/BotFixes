import { User } from 'kissbot-core';
import { ComponentManagerEnum } from '../../../../interfaces/component-manager.enum';
import { OptionModalMenu } from '../../../MenuSelection';
import { WorkspaceAccessControl } from '../GroupsAccessWrapper/interface';

export interface EditGroupAccessProps {
    group?: WorkspaceAccessControl | undefined;
    workspaceId: string;
    addNotification: Function;
    onCancel: Function;
    onUpdatedGroup: Function;
    onCreatedGroup: Function;
    userList: User[];
    onDeletedGroup: Function;
    loadingRequest: boolean;
    editing: boolean;
    selectedTab: OptionModalMenu;
    setCurrentComponent: React.Dispatch<React.SetStateAction<ComponentManagerEnum>>;
}
