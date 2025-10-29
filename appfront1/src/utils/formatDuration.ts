import * as moment from 'moment';

export const formatDuration = (value: number) => {
    return moment.duration(value, 'milliseconds').format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' });
};
