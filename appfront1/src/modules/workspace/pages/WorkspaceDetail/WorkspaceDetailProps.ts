import { I18nProps } from './../../../i18n/interface/i18n.interface';
import { Workspace } from "../../../../model/Workspace";
import { Bot } from "../../../../model/Bot";
import { User } from "kissbot-core";

export interface WorkspaceDetailProps extends I18nProps {
    botList : Array<Bot> | any;
    loggedUser: User | {};
    setBotList: (botList: Array<Bot>) => any;
    setSelectedWorkspace: (workspace: Workspace) => any;
    match?: any;
    history?: any;
    workspaceList : Array<Workspace>;
}

export interface WorkspaceDetailState{
    isSubmitting: boolean;
    workspace: Workspace | undefined;
}
