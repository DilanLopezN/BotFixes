import { SpinnerContainer } from '~/components/spinner-container';
import { useAuth } from '~/hooks/use-auth';
import { AppTypePort, redirectApp } from '~/utils/redirect-app';
import type { NotAuthProps } from './interface';

export const NotAuth = ({ children }: NotAuthProps) => {
  const { isAuth, isAuthenticating } = useAuth();

  if (isAuthenticating) {
    return <SpinnerContainer message='Autenticando...' />;
  }

  if (isAuth) {
    redirectApp({ pathname: '/home', appTypePort: AppTypePort.APP, addExtraQueries: false });
    return <> </>;
  }

  return children;
};
