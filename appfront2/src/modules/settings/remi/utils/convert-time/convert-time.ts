import { RuleObject } from 'antd/es/form';
import { StoreValue } from 'antd/es/form/interface';
import { FormInstance } from 'antd/lib';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { TFunction } from 'i18next';
import { isNaN } from 'lodash';
import { localeKeys } from '~/i18n';

dayjs.extend(customParseFormat);

const FORMAT = 'HH:mm';
const MIN_MINUTES_PER_INPUT = 2;
const MAX_TOTAL_MINUTES = 300;

export const convertHHMMToMinutes = (timeString?: string | Dayjs | null): number => {
  if (!timeString) {
    return 0;
  }

  let dayjsObj: Dayjs;
  if (dayjs.isDayjs(timeString)) {
    dayjsObj = timeString;
  } else if (typeof timeString === 'string') {
    const parsed = dayjs(timeString, FORMAT, true);
    if (!parsed.isValid()) {
      return 0;
    }
    dayjsObj = parsed;
  } else {
    return 0;
  }

  return dayjsObj.hour() * 60 + dayjsObj.minute();
};

export const convertMinutesToHHMM = (totalMinutes?: number | null): string => {
  if (
    totalMinutes === undefined ||
    totalMinutes === null ||
    totalMinutes < 0 ||
    isNaN(totalMinutes)
  ) {
    return '00:00';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}`;
};

export const totalTimeValidator = (
  _: RuleObject,
  value: StoreValue,
  form: FormInstance,
  fieldNames: string[],
  t: TFunction,
  allowZeroTime?: boolean
): Promise<void> => {
  const { convertTime: remiKeys } = localeKeys.settings.remi.utils;
  if (!value) {
    return Promise.reject(new Error(t('Campo obrigatório')));
  }

  const current = dayjs(value, FORMAT);
  const currentMinutes = current.hour() * 60 + current.minute();

  if (isNaN(currentMinutes)) {
    return Promise.reject(new Error(t('Horário inválido')));
  }

  if (currentMinutes < MIN_MINUTES_PER_INPUT && !allowZeroTime) {
    return Promise.reject(new Error(t(remiKeys.intervalMinLimitError)));
  }

  const allValues = fieldNames.map((name) => {
    const val = form.getFieldValue(name);
    const time = dayjs(val, FORMAT);
    const mins = time.isValid() ? time.hour() * 60 + time.minute() : 0;
    return mins;
  });

  const totalMinutes = allValues.reduce((sum, curr) => sum + curr, 0);

  if (totalMinutes > MAX_TOTAL_MINUTES) {
    return Promise.reject(
      new Error(
        t(remiKeys.intervalHoursLimitError, {
          limit: MAX_TOTAL_MINUTES / 60,
        })
      )
    );
  }

  return Promise.resolve();
};
