import { useEffect, useRef } from 'react';

export const useInterval = (callback: () => void, delay: number) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const action = () => {
      savedCallback.current();
    };

    if (delay > 0) {
      intervalId = setInterval(action, delay);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [delay]);
};
