import { AppTypePort, getBaseUrl } from '~/utils/redirect-app';
import { LinkToHomeProps } from './interfaces';

export const LinkToHome = ({ children }: LinkToHomeProps) => {
  const path = getBaseUrl({ pathname: '/home', appTypePort: AppTypePort.APP });

  return <a href={path}>{children}</a>;
};
