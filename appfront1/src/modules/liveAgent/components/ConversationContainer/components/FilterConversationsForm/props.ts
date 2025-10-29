import { Team } from './../../../../../../model/Team';
import { Tag } from "../../../TagSelector/props";
import { User } from 'kissbot-core';
import { Workspace } from '../../../../../../model/Workspace';
import { ChannelConfig } from '../../../../../../model/Bot';

export interface FilterConversationsFormProps {
    onApplyFilters: (args: any) => any;
    appliedFilters?: any;
    workspaceTags: Tag[];
    workspaceTeams: Team[];
    workspaceChannelConfigs: ChannelConfig[];
    users: User[]
    qtdApplyFilters: (args: any) => any;
    workspaceId: string;
    userId: string;
    selectedWorkspace: Workspace;
}