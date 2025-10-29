import {
    ConversationTemplate,
    TemplateGroupField,
    TemplateMetrics,
} from '../modules/dashboard/components/TabGraphics/interfaces/conversation-template-interface';

export const GraphicConvertName = (name, template: ConversationTemplate) => {
    if (name === null) {
        if (template.groupField === TemplateGroupField.assigned_to_team_id) {
            return 'Service without assigned team';
        } else if (template.groupField === TemplateGroupField.closed_by) {
            return 'Unfinished services';
        } else if (template.groupField === TemplateGroupField.rating) {
            return 'Without rating';
        } else if (template.groupField === TemplateGroupField.referral_source_id) {
            return 'Services without linked advertising';
        } else if (template.groupField === TemplateGroupField.categorization_objective) {
            return 'Appointments without a purpose';
        } else if (template.groupField === TemplateGroupField.categorization_outcome) {
            return 'Appointments without an outcome';
        }
        return 'Unknown';
    }

    if (name) {
        return name;
    } else if (template.metric === TemplateMetrics.total) {
        return 'Total attendances';
    } else if (template.metric === TemplateMetrics.time_to_close) {
        return 'Attendance average time';
    } else if (template.metric === TemplateMetrics.rating_avg) {
        return 'Evaluation average';
    } else if (template.metric === TemplateMetrics.first_agent_reply_avg) {
        return 'Waiting average time';
    } else {
        return 'Average waiting time for service during active hours';
    }
};
