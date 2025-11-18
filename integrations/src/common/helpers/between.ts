import * as moment from 'moment';

export const between = (n: number, min?: number, max?: number) => {
  if (!Number.isInteger(max) && !Number.isInteger(min)) {
    return true;
  }

  if (!Number.isInteger(min)) {
    return n <= max;
  }

  if (!Number.isInteger(max)) {
    return n >= min;
  }

  return n <= max && n >= min;
};

export const betweenDate = (date: string, startDate?: number, endDate?: number) => {
  if (!moment(date).isValid()) {
    return false;
  }

  const appointmentTimestamp = moment(date).valueOf();
  let isValid = true;

  if (startDate && endDate) {
    isValid = appointmentTimestamp > moment(startDate).valueOf() && appointmentTimestamp < moment(endDate).valueOf();
  } else {
    if (startDate) {
      isValid = appointmentTimestamp > moment(startDate).valueOf();
    }

    if (endDate) {
      isValid = appointmentTimestamp < moment(endDate).valueOf();
    }
  }

  return isValid;
};
