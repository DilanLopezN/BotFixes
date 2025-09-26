import { User } from 'kissbot-core';
import { Team } from '../../../../../../model/Team';
import { Workspace } from '../../../../../../model/Workspace';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import { ConversationTemplate, TemplateGroupInterface } from '../../interfaces/conversation-template-interface';
import { ChannelConfig } from '../../../../../../model/Bot';
import { v2ResponseModel } from '../../../../../../interfaces/v2-response-model';
import { ConversationObjective } from '../../../../../liveAgent/interfaces/conversation-objective';

export interface GraphicsFormProps {
    closeForm: (value?: ConversationTemplate, value2?: TemplateGroupInterface) => void;
    conversationTemplate: ConversationTemplate | undefined;
    selectedWorkspace: Workspace;
    loggedUser: User;
    teams: Team[];
    getConversationTemplates: Function;
    tags: Tag[];
    users: User[];
    setConversationTemplate: (value) => void;
    templateGroup: TemplateGroupInterface | undefined;
    setTemplateGroup: (value) => void;
    getTemplateGroups: Function;
    dashboardSelected?: TemplateGroupInterface;
    workspaceChannelConfigs: ChannelConfig[];
    workspaceReferrals: { source_id: string }[];
    conversationOutcomes: v2ResponseModel<ConversationObjective[]> | undefined;
    conversationObjectives: v2ResponseModel<ConversationObjective[]> | undefined;
}
