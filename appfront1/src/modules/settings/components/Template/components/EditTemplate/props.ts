import { User } from 'kissbot-core';
import { TemplateMessage } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import { ComponentManagerEnum } from '../../../../interfaces/component-manager.enum';

export interface EditTemplateProps {
    template?: TemplateMessage;
    workspaceId: string;
    user: User;
    addNotification: Function;
    onCancel: Function;
    onUpdatedTemplate: Function;
    onCreatedTemplate: Function;
    onDeletedTemplate: Function;
    loadingRequest: boolean;
    editing: boolean;
    setLoadingRequest: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentComponent: React.Dispatch<React.SetStateAction<ComponentManagerEnum>>;
}
