import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { AppTypePort, RedirectAppProps, redirectApp } from '~/utils/redirect-app';

export const RedirectApp = ({
  appTypePort,
  pathname,
  queryString,
  addExtraQueries,
}: RedirectAppProps) => {
  const navigate = useNavigate();
  const selectedWorkspace = useSelectedWorkspace();

  useEffect(() => {
    if (!selectedWorkspace) return;

    if (appTypePort === AppTypePort.V2) {
      const formattedPathname = pathname.replace(/^\/+/, '');

      navigate(`/${selectedWorkspace._id}/${formattedPathname}`);
      return;
    }

    redirectApp({ appTypePort, pathname, queryString, addExtraQueries });
  }, [addExtraQueries, appTypePort, navigate, pathname, queryString, selectedWorkspace]);

  return null;
};
