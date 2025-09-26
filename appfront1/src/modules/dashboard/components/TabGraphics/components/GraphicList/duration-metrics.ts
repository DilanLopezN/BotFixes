import { TemplateMetrics } from '../../interfaces/conversation-template-interface';

export const durationMetrics: TemplateMetrics[] = [
    TemplateMetrics.first_agent_reply_avg,
    TemplateMetrics.time_to_close,
    TemplateMetrics.awaiting_working_time_avg,
    TemplateMetrics.metrics_median_time_to_agent_reply,
    TemplateMetrics.metrics_median_time_to_user_reply,
];
