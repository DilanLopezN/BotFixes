import { ChannelConfig } from './../../../model/Bot';
import { Workspace } from "../../../model/Workspace";
import { Bot } from "../../../model/Bot";

export interface ReduxInterface{
    workspaceList : undefined | Workspace[];
    botList: undefined | Bot[];
    selectedWorkspace: undefined | Workspace;
    channelList: ChannelConfig[];
} 
