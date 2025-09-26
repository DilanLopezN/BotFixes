import type { RuleObject } from 'antd/es/form';
import type { StoreValue } from 'antd/es/form/interface';

export const hasOnlyWhitespaces = (message: string) => ({
  validator: async (_: RuleObject, value: StoreValue) => {
    if (!value) {
      return;
    }

    const isWhitespace = !/\S/.test(value);

    if (isWhitespace) {
      throw new Error(message);
    }
  },
});
