import { getBaseUrl } from './get-base-url';
import { RedirectAppProps } from './interface';

export const redirectApp = ({
  pathname,
  appTypePort,
  queryString = '',
  addExtraQueries = true,
}: RedirectAppProps) => {
  const baseUrl = getBaseUrl({
    pathname,
    appTypePort,
    queryString,
    addExtraQueries,
  });
  window.location.href = baseUrl;
};
