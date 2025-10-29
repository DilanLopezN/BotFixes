import moment from "moment-timezone";

export const formatUtcValue = (value: number): string => {
    return moment.utc(value || 0).format('HH:mm:ss');
};
