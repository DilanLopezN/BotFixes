import { AppTypePort } from '~/utils/redirect-app';

export interface MenuNavigatorProps {
  pathname: string;
  appTypePort: AppTypePort;
  children: React.ReactNode;
}
