import { getWorkspaceIdFromUrl } from '../get-workpace-id-from-url';
import { isLocalHost } from '../is-local-host';
import { AppTypePort } from './constants';
import { RedirectAppProps } from './interface';

export const getBaseUrl = ({
  pathname,
  appTypePort,
  queryString = '',
  addExtraQueries = true,
}: RedirectAppProps) => {
  let extraQueryString = '';

  if (appTypePort === AppTypePort.APP && addExtraQueries) {
    const workspaceId = `workspaceId=${getWorkspaceIdFromUrl()}`;
    extraQueryString = queryString ? `&${workspaceId}` : `?${workspaceId}`;
  }

  const urlParams = pathname + queryString + extraQueryString;

  // Remove o caractere "/", caso ele seja o primeiro caractere.
  const formattedUrl = urlParams.replace(/^\/+/, '');

  const path = isLocalHost
    ? `http://localhost:${appTypePort}/${formattedUrl}`
    : `${window.location.origin}/${formattedUrl}`;

  return path;
};
