import { useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../use-auth';
import { useSelectedWorkspace } from '../use-selected-workspace';
import { MenuList } from './interfaces';

export const useMenuWithPermissions = (menuList: MenuList[]) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const selectedWorkspace = useSelectedWorkspace();
  const selectedKey = useRef('');

  const generateMenu = useCallback(
    (mList?: MenuList[], isKeyFounded?: boolean): MenuList[] => {
      if (!user || !mList || mList.length === 0) return [];
      let foundedKey = isKeyFounded || false;

      const newMenu = mList.reduce<MenuList[]>((acc, menu) => {
        if (!isKeyFounded && pathname.includes(menu.key)) {
          selectedKey.current = menu.key;
          foundedKey = true;
        }

        if (menu.hasPermission && !menu.hasPermission(user, selectedWorkspace)) {
          return acc;
        }

        if (
          menu.allowedRoles &&
          !menu.allowedRoles.some((allowedRole) =>
            user?.roles?.some(
              (userRole) =>
                userRole.role === allowedRole.role && userRole.resource === allowedRole.resource
            )
          )
        ) {
          return acc;
        }

        if (menu.children) {
          const children = generateMenu(menu.children, foundedKey);
          if (menu.type === 'group' && children.length === 0) {
            return acc;
          }

          return [...acc, { key: menu.key, label: menu.label, type: menu.type, children }];
        }

        return acc.concat({
          key: menu.key,
          label: menu.label,
          type: menu.type,
          children: menu.children,
        });
      }, []);

      return newMenu;
    },
    [pathname, selectedWorkspace, user]
  );

  const menu = useMemo(() => generateMenu(menuList), [generateMenu, menuList]);

  return { menu, selectedKey: selectedKey.current };
};
