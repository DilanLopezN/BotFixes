import { Document } from 'mongoose';
import { AnalyticsInterval } from '../../conversation-analytics/interfaces/analytics.interface';

export enum TemplateMetrics {
    // média em cima do campo 'metrics_time_to_agent_reply'
    first_agent_reply_avg = 'first_agent_reply_avg',
    metrics_median_time_to_agent_reply = 'metrics_median_time_to_agent_reply',
    metrics_median_time_to_user_reply = 'metrics_median_time_to_user_reply',
    time_to_close = 'time_to_close',
    rating_avg = 'rating_avg',
    awaiting_working_time_avg = 'awaiting_working_time_avg',
    total_assumed_by_agent = 'total_assumed_by_agent',
    total = 'total',
    average_team_time_attendance = 'average_team_time_attendance',
}

export enum FixedClosedBy {
    bot = 'bot',
    not_closed = 'not_closed',
    all_agents = 'all_agents',
}

export enum TemplateGroupField {
    assigned_to_team_id = 'assigned_to_team_id',
    closed_by = 'closed_by',
    agents = 'agents',
    created_by_channel = 'created_by_channel',
    tags = 'tags',
    no_field = 'no_field',
    hour_interval = 'hour_interval',
    rating = 'rating',
    token = 'token',
    referral_source_id = 'referral_source_id',
    categorization_objective = 'categorization_objective',
    categorization_outcome = 'categorization_outcome',
}

export enum ChartType {
    line = 'line',
    bar = 'bar',
    pizza = 'pizza',
    table = 'table',
}

// export enum ChartInterval {
//     days = '1d',
//     weeks = '1w',
//     months = '1M',
// }

export enum Operator {
    in = 'in',
    not_in = 'not_in',
}

export interface Condition {
    field: TemplateGroupField;
    values: string[];
    operator: Operator;
}

export interface ConversationTemplate extends Document {
    workspaceId: string;
    name: string;
    groupId: string;
    groupField: TemplateGroupField;
    metric: TemplateMetrics;
    chartType: ChartType;
    conditions: Condition[];
    interval: AnalyticsInterval;
    position: number[];
}
