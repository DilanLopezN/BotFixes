import { useCallback, useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProvidersContainer } from '~/providers-container';
import { RouteType, routes } from './constants';
import type { RouteNodes } from './interfaces';
import { RouteWrapper } from './route-wrapper';

export const AppRoutes = () => {
  const normalizeRoutes = useCallback(
    (routeChildren: RouteNodes, isParentAuthenticated?: boolean) => {
      const normalizedRoutes = Object.values(routeChildren).map((route) => {
        const wrappedElement = (
          <RouteWrapper route={route} isParentAuthenticated={isParentAuthenticated} />
        );

        if (route.children) {
          return (
            <Route key={route.path} path={route.path} element={wrappedElement}>
              {normalizeRoutes(
                route.children,
                isParentAuthenticated || route.type === RouteType.auth
              )}
            </Route>
          );
        }

        return <Route key={route.path} path={route.path} element={wrappedElement} />;
      });

      return normalizedRoutes;
    },
    []
  );

  const normalizedRoutes = useMemo(() => {
    return normalizeRoutes(routes);
  }, [normalizeRoutes]);

  return (
    <Routes>
      <Route element={<ProvidersContainer />}>{normalizedRoutes}</Route>
    </Routes>
  );
};
