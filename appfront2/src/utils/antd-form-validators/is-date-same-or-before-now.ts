import type { RuleObject } from 'antd/es/form';
import type { StoreValue } from 'antd/es/form/interface';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

export const isDateSameOrBeforeNow = (message: string) => ({
  validator: async (_: RuleObject, value: StoreValue) => {
    if (!value) {
      return;
    }

    const selectedDate = dayjs(value);

    if (selectedDate.isSameOrBefore(dayjs())) {
      throw new Error(message);
    }

    return Promise.resolve();
  },
});
