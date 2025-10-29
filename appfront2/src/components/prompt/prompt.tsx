import { useCallback, useEffect } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';
import type { PromptProps } from './interfaces';

export const Prompt = ({ when }: PromptProps) => {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname
  );

  const isBlocked = blocker.state === 'blocked';

  useEffect(() => {
    if (isBlocked) {
      const confirm = window.confirm('Você tem alterações não salvas. Realmente deseja sair?');

      if (confirm) {
        if (blocker.proceed) {
          blocker.proceed();
        }
      } else if (blocker.reset) {
        blocker.reset();
      }
    }
  }, [blocker, isBlocked]);

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!when) return;
        event.preventDefault();
      },
      [when]
    ),
    { capture: true }
  );

  return null;
};
