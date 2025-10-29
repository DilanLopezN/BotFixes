import { useEffect, useRef } from 'react';

export const usePreviousState = <T>(newState: T): T | undefined => {
  const previousState = useRef<T>();

  useEffect(() => {
    previousState.current = newState;
  }, [newState]);

  return previousState.current;
};
