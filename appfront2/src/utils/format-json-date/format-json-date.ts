import dayjs from 'dayjs';

export const formatJsonDate = (date: string) => {
  return dayjs(date).format('DD/MM/YYYY');
};
