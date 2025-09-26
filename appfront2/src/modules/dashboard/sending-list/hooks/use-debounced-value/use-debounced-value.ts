import { debounce } from 'lodash';
import { useEffect, useState } from 'react';

export const useDebouncedValue = <T>(value: T): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedValue(value);
    }, 300);

    handler();

    return () => {
      handler.cancel();
    };
  }, [value]);

  return debouncedValue;
};
