import { Navigate } from 'react-router-dom';
import { RedirectApp } from '~/components/redirect';
import { useAuth } from '~/hooks/use-auth';
import { isLocalHost } from '~/utils/is-local-host';
import { AppTypePort } from '~/utils/redirect-app';
import { routes } from '../constants';

export const BaseRoute = () => {
  const { isAuth } = useAuth();

  if (isAuth) {
    return <RedirectApp pathname='/' appTypePort={AppTypePort.APP} addExtraQueries={false} />;
  }

  if (isLocalHost) {
    return <Navigate to={routes.login.path} />;
  }

  return <RedirectApp pathname='/users/login' appTypePort={AppTypePort.APP} />;
};
