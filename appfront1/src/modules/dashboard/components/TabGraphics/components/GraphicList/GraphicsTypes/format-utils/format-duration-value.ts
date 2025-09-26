import moment from 'moment';
import 'moment-duration-format';

export const formatDurationValue = (value: number): string => {
    return moment
        .duration(value || 0, 'milliseconds')
        .format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' });
};
