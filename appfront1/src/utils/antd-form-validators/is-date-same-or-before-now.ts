import type { RuleObject } from 'antd/es/form';
import type { StoreValue } from 'antd/es/form/interface';
import moment from 'moment';

export const isDateSameOrBeforeNow = (message: string) => ({
    validator: async (_: RuleObject, value: StoreValue) => {
        if (!value) {
            return;
        }

        const selectedDate = moment(value);

        if (selectedDate.isSameOrBefore(moment())) {
            throw new Error(message);
        }

        return Promise.resolve();
    },
});
