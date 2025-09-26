import { Workspace } from '../../../../../../model/Workspace';
import { User } from 'kissbot-core';

export interface ConfirmationSettingFormProps {
    loggedUser: User;
    selectedWorkspace: Workspace;
    setCreateConfirmationSetting: React.Dispatch<React.SetStateAction<boolean>>;
}
