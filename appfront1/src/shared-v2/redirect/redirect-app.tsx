import { useEffect } from 'react';
import { APP_TYPE_PORT, RedirectAppProps, redirectApp } from '../../utils/redirectApp';
import { useHistory } from 'react-router-dom';

export const RedirectApp = ({ appTypePort, pathname, queryString }: RedirectAppProps) => {
    const history = useHistory();

    useEffect(() => {
        if (appTypePort === APP_TYPE_PORT.APP) {
            history.replace(pathname);
            return;
        }

        redirectApp({ appTypePort, pathname, queryString });
    }, [appTypePort, history, pathname, queryString]);

    return null;
};
