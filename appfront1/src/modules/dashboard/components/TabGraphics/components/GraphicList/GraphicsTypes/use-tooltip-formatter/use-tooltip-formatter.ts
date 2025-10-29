import { TooltipFormatterContextObject } from 'highcharts';
import { useLanguageContext } from '../../../../../../../i18n/context';
import { TemplateGroupField, TemplateMetrics } from '../../../../interfaces/conversation-template-interface';
import { durationMetrics } from '../../duration-metrics';
import { formatDurationValue } from '../format-utils/format-duration-value';

export const useTooltipFormatter = () => {
    const { getTranslation } = useLanguageContext();

    const getMetricTranslationKey = (metric: TemplateMetrics): string => {
        switch (metric) {
            case TemplateMetrics.time_to_close:
                return 'Attendance average time';
            case TemplateMetrics.first_agent_reply_avg:
                return 'Waiting average time';
            case TemplateMetrics.awaiting_working_time_avg:
                return 'Average waiting time for service during active hours';
            case TemplateMetrics.metrics_median_time_to_agent_reply:
                return 'Median time for agent reply';
            case TemplateMetrics.metrics_median_time_to_user_reply:
                return 'Median time for user reply';
            case TemplateMetrics.rating_avg:
                return 'Rating';
            default:
                return '';
        }
    };

    const formatTooltip = (
        template: { metric: TemplateMetrics; groupField: TemplateGroupField },
        thisContext: TooltipFormatterContextObject,
        chartType: 'line' | 'column' | 'pie'
    ): string => {
        const { metric, groupField } = template;
        const isDurationMetric = durationMetrics.includes(metric);
        const formattedValue = isDurationMetric ? formatDurationValue(thisContext?.y || 0) : thisContext?.y;
        const translationKey = getMetricTranslationKey(metric);

        const isPieChart = chartType === 'pie';
        const shouldShowSeriesName = !isPieChart && groupField !== TemplateGroupField.no_field;

        const seriesData = !isPieChart ? thisContext.x : '';
        const seriesName = shouldShowSeriesName ? thisContext?.series.name : '';
        const sereisInfo = isPieChart ? thisContext.key : getTranslation(translationKey);

        if (isDurationMetric) {
            return `${seriesData} <br /><b>${sereisInfo}:</b>  ${formattedValue} <br />${seriesName}`;
        }

        if (metric === TemplateMetrics.rating_avg) {
            return `${thisContext?.x} <br /> ${getTranslation('Rating')} ${formattedValue} <br />`;
        }

        return `${thisContext?.key} <br /> ${formattedValue} ${getTranslation('Conversations')} <br /> ${seriesName}`;
    };

    return { formatTooltip };
};
