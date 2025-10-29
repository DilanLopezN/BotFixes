import moment from 'moment';

export const formatDateFromApi = (date?: string) => {
    if (!date) return '';

    return moment(date).format('DD/MM/YYYY HH:MM');
};
