import { Auth } from './auth';
import { NotAuth } from './not-auth';
import { RouteType } from '../constants';
import type { RouteWrapperProps } from './interfaces';

export const RouteWrapper = ({ route, isParentAuthenticated }: RouteWrapperProps) => {
  if (route.type === RouteType.auth || isParentAuthenticated) {
    return (
      <Auth
        allowedRoles={route.allowedRoles}
        isParentAuthenticated={isParentAuthenticated}
        hasPermission={route.hasPermission}
      >
        {route.element as JSX.Element}
      </Auth>
    );
  }

  if (route.type === RouteType.notAuth) {
    return <NotAuth>{route.element as JSX.Element}</NotAuth>;
  }

  return route.element as JSX.Element;
};
