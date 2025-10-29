import moment from 'moment';

export const msToTime = (duration: string | number) => {
    return moment.duration(duration, 'milliseconds').format('HH:mm:ss', { forceLength: true, stopTrim:'h' });
};
