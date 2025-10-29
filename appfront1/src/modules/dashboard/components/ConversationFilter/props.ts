import { User } from 'kissbot-core';
import { Team } from '../../../../model/Team';
import { Workspace } from '../../../../model/Workspace';
import { ConversationTemplate } from '../TabGraphics/interfaces/conversation-template-interface';

export interface FiltersProps {
    selectedWorkspace?: Workspace;
    initialFilter: ConversationFilterInterface;
    teams: Team[];
    onSubmit: (filter: ConversationFilterInterface) => any;
    loggedUser: User;
    disable: boolean;
    showAgentsTabs?: boolean;
}

export interface ConversationFilterInterface {
    interval: '1C' | '1h' | '1d' | '1w' | '1M' | '';
    tags?: string[];
    botId?: string;
    timezone?: string;
    endDate: string;
    startDate: string;
    teamId?: string;
    teamIds?: string[];
    channelId?: string;
    conversationsWith?: 'agent' | 'bot' | 'not_closed' | 'all';
    groupBy?:
        | 'user'
        | 'tags'
        | 'team'
        | 'team-resume'
        | 'total'
        | 'user-resume'
        | 'user-resume-avg'
        | 'attendance-date-avg'
        | 'awaiting-working-time-avg';
    closedBy?: string[];
    workspaceId: string;
    isHsm?: boolean;
    dashboardTemplateId?: string;
    dashboardConversationTemplate?: ConversationTemplate;
    omitInvalidNumber?: boolean;
}

export interface FilterSelect {
    [workspaceId: string]: ConversationFilterInterface;
}
