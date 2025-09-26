import { AppTypePort } from './constants';

export interface RedirectAppProps {
  pathname: string;
  queryString?: string;
  appTypePort: AppTypePort;
  addExtraQueries?: boolean;
}
