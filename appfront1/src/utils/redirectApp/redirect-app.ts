import { getBaseUrl } from './get-base-url';
import { RedirectAppProps } from './interface';

export const redirectApp = ({ pathname, appTypePort, queryString = '' }: RedirectAppProps) => {
    const baseUrl = getBaseUrl({
        pathname,
        appTypePort,
        queryString,
    });
    window.location.href = baseUrl;
};
