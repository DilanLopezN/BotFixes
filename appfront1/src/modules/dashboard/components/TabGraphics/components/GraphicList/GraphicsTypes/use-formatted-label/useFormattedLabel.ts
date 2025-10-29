import { TooltipFormatterContextObject } from 'highcharts';
import 'moment-duration-format';
import { useCallback } from 'react';
import { useLanguageContext } from '../../../../../../../i18n/context';
import {
    ConversationTemplate,
    TemplateGroupField,
    TemplateMetrics,
} from '../../../../interfaces/conversation-template-interface';
import { formatDurationValue } from '../format-utils/format-duration-value';
import { formatUtcValue } from '../format-utils/format-utc-value';

const useFormattedLabel = () => {
    const { getTranslation } = useLanguageContext();

    return useCallback((template: ConversationTemplate, thisContext: TooltipFormatterContextObject): string => {
        const yValue = thisContext?.y ?? 0;
        const keyValue = thisContext?.key ?? '';
        switch (template.metric) {
            case TemplateMetrics.time_to_close:
                return template.groupField === TemplateGroupField.no_field
                    ? `<b>${getTranslation('Attendance average time')}:</b></br> ${formatUtcValue(yValue)}`
                    : `<b>${keyValue}:</b></br> ${formatDurationValue(yValue)}`;

            case TemplateMetrics.first_agent_reply_avg:
                return template.groupField === TemplateGroupField.no_field
                    ? `<b>${getTranslation('Waiting average time')}:</b></br> ${formatDurationValue(yValue)}`
                    : `<b>${keyValue}:</b></br> ${formatDurationValue(yValue)}`;

            case TemplateMetrics.metrics_median_time_to_agent_reply:
                return template.groupField === TemplateGroupField.no_field
                    ? `<b>${getTranslation('Median time for agent reply')}:</b></br> ${formatDurationValue(yValue)}`
                    : `<b>${keyValue}:</b></br> ${formatDurationValue(yValue)}`;

            case TemplateMetrics.metrics_median_time_to_user_reply:
                return template.groupField === TemplateGroupField.no_field
                    ? `<b>${getTranslation('Median time for user reply')}:</b></br> ${formatDurationValue(yValue)}`
                    : `<b>${keyValue}:</b></br> ${formatDurationValue(yValue)}`;

            case TemplateMetrics.awaiting_working_time_avg:
                return template.groupField === TemplateGroupField.no_field
                    ? `<b>${getTranslation(
                          'Average waiting time for service during active hours'
                      )}:</b></br> ${formatDurationValue(yValue)}`
                    : `<b>${keyValue}:</b></br> ${formatDurationValue(yValue)}`;

            case TemplateMetrics.rating_avg:
                return `<b>${keyValue}</b>: ${yValue}`;

            default:
                return `<b>${keyValue}</b>: ${thisContext?.percentage.toFixed(1)}%`;
        }
    }, []);
};
export { useFormattedLabel };
