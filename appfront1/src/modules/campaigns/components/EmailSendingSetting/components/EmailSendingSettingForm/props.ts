import { Workspace } from '../../../../../../model/Workspace';
import { User } from 'kissbot-core';

export interface EmailSendingSettingFormProps {
    loggedUser: User;
    selectedWorkspace: Workspace;
}
