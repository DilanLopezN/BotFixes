import { ConversationTemplate } from "../../dashboard-template/interfaces/conversation-template.interface";

export enum AnalyticsInterval {
    '1m' = '1m',
    '1h' = '1h',
    '1d' = '1d',
    '1w' = '1w',
    '1M' = '1M',
    '1C' = '1C',
}
export interface ConversationQueryFilterDto {
    interval: AnalyticsInterval;
    tags?: string[];
    botId?: string;
    timezone?: string;
    endDate: string;
    startDate: string;
    teamId?: string;
    teamIds?: string[];
    channelId?: string;
    conversationsWith?: 'bot' | 'agent' | 'not_closed' |'all';
    groupBy?: 'user' | 'tags' | 'team' | 'team-resume' | 'total' | 'user-resume' | 'attendance-date-avg' | 'awaiting-working-time-avg' | 'user-resume-avg';
    closedBy?: string[];
    workspaceId: string;
    omitInvalidNumber?: boolean;
}

export interface ConversationQueryFilter extends ConversationQueryFilterDto {
    dashboardTemplateId?: string;
    dashboardConversationTemplate?: ConversationTemplate;
}

export interface ActivityQueryFilter extends ConversationQueryFilterDto {
    isHsm?: boolean;
}
