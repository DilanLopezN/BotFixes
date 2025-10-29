import { useCallback } from 'react';
import { TemplateMetrics } from '../../../../interfaces/conversation-template-interface';
import { durationMetrics } from '../../duration-metrics';
import { formatDurationValue } from '../format-utils/format-duration-value';

export const useFormatYAxisValue = () => {
    return useCallback((metric: TemplateMetrics, value: any): string => {
        const isDurationMetric = durationMetrics.includes(metric);

        if (isDurationMetric) {
            return formatDurationValue(value);
        }
        return `${value || 0}`;
    }, []);
};
