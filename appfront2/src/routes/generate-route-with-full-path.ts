import { RouteNodes } from './interfaces';

export const generateRouteWithFullPath = <T extends RouteNodes>(routes: T, path?: string) => {
  const newRoutes = Object.entries(routes).reduce<RouteNodes>((previousValue, currentValue) => {
    const [key, value] = currentValue;
    const fullPath = path ? `${path}/${value.path}` : `/${value.path}`;
    if (value.children) {
      const newChildren = generateRouteWithFullPath(value.children, fullPath) as RouteNodes;
      return { ...previousValue, [key]: { ...value, fullPath, children: newChildren } };
    }

    return { ...previousValue, [key]: { ...value, fullPath } };
  }, {});

  return newRoutes as T;
};
