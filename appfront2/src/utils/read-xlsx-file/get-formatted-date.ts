import dayjs from 'dayjs';

export const getFormattedDate = (date: dayjs.Dayjs) => {
  const hasSeconds = date.second() !== 0;
  const hasHour = date.hour() !== 0 || date.minute() !== 0;
  const hasDate = date.isAfter('1899-12-31', 'days');

  if (hasDate && hasHour && hasSeconds) {
    return date.format('DD/MM/YYYY HH:mm:ss');
  }

  if (hasDate && hasHour) {
    return date.format('DD/MM/YYYY HH:mm');
  }

  if (hasDate && hasSeconds) {
    return date.format('DD/MM/YYYY HH:mm:ss');
  }

  if (hasDate) {
    return date.format('DD/MM/YYYY');
  }

  if (hasHour && hasSeconds) {
    return date.format('HH:mm:ss');
  }

  if (hasHour) {
    return date.format('HH:mm');
  }

  // Última e única opção restante, if(hasSeconds)
  return date.format('HH:mm:ss');
};
