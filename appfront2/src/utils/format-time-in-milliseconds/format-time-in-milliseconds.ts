import { type Dayjs } from 'dayjs';

export const formatTimeInMilliseconds = (time: Dayjs) => {
  const selectedTime = time;
  const ms = selectedTime.hour() * 3600000 + selectedTime.minute() * 60000;
  return ms;
};
