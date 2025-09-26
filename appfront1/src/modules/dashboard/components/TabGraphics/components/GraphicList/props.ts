import { User } from 'kissbot-core';
import { Team } from '../../../../../../model/Team';
import { Workspace } from '../../../../../../model/Workspace';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import { ConversationTemplate, TemplateGroupInterface } from '../../interfaces/conversation-template-interface';
import { ChannelConfig } from '../../../../../../model/Bot';
import { v2ResponseModel } from '../../../../../../interfaces/v2-response-model';
import { ConversationObjective } from '../../../../../liveAgent/interfaces/conversation-objective';

export interface GraphicListProps {
    selectedWorkspace: Workspace;
    loggedUser: User;
    onLoading: Function;
    loading: boolean;
    teams: Team[];
    conversationTemplates: ConversationTemplate[];
    setConversationTemplates: (value: ConversationTemplate[]) => void;
    tags: Tag[];
    users: User[];
    setConversationTemplate: (value: ConversationTemplate) => void;
    conversationTemplate: ConversationTemplate | undefined;
    getConversationTemplates: Function;
    templateGroup?: TemplateGroupInterface;
    templateGroups: TemplateGroupInterface[];
    dashboardSelected?: TemplateGroupInterface;
    setDashboardSelected: (value?: TemplateGroupInterface) => void;
    getTemplateGroups: Function;
    setTemplateGroup: (value) => void;
    workspaceChannelConfigs: ChannelConfig[];
    conversationOutcomes: v2ResponseModel<ConversationObjective[]> | undefined;
    conversationObjectives: v2ResponseModel<ConversationObjective[]> | undefined;
}
