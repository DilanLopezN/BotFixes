import { isLocalhost } from '../isLocalHost';
import { RedirectAppProps } from './interface';

export const getBaseUrl = ({ pathname, appTypePort, queryString = '' }: RedirectAppProps) => {
    const urlParams = pathname + queryString;

    // Remove o caractere "/", caso ele seja o primeiro caractere.
    const formattedUrl = urlParams.replace(/^\/+/, '');

    const path = isLocalhost
        ? `http://localhost:${appTypePort}/${formattedUrl}`
        : `${window.location.origin}/${formattedUrl}`;

    return path;
};
