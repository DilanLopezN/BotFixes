import { APP_TYPE_PORT } from './constants';

export interface RedirectAppProps {
    pathname: string;
    queryString?: string;
    appTypePort: APP_TYPE_PORT;
}
