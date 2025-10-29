import { Menu } from 'antd';
import type { ItemType } from 'antd/es/menu/interface';
import { useTranslation } from 'react-i18next';
import { MenuNavigator } from '~/components/menu-navigator';
import { useMenuWithPermissions } from '~/hooks/use-menu-with-permissions';
import { MenuList } from '~/hooks/use-menu-with-permissions/interfaces';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes/constants';
import { AppTypePort } from '~/utils/redirect-app';

export const SidebarMenu = () => {
  const { t } = useTranslation();
  const { children: trainerBotModules } = routes.modules.children.trainerBot;
  const { sidebarMenu: sidebarMenuLocaleKeys } = localeKeys.trainerBot;
  const menuList: MenuList[] = [
    {
      key: 'menu-group-1',
      label: t(sidebarMenuLocaleKeys.configurationMenuGroup),
      type: 'group',
      children: [
        {
          key: trainerBotModules.training.path,
          label: (
            <MenuNavigator pathname={trainerBotModules.training.path} appTypePort={AppTypePort.V2}>
              {t(sidebarMenuLocaleKeys.trainingMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: trainerBotModules.training.allowedRoles,
          hasPermission: trainerBotModules.training.hasPermission,
        },
      ],
    },
  ];

  const { menu, selectedKey } = useMenuWithPermissions(menuList);

  const normalizedMenu = menu.map((item) => ({
    label: item.label,
    key: item.key,
    children: item.children,
    type: item.type,
  })) as ItemType[];

  return (
    <Menu
      style={{ height: '100vh' }}
      expandIcon={false}
      mode='inline'
      theme='light'
      items={normalizedMenu}
      selectedKeys={[selectedKey]}
    />
  );
};
