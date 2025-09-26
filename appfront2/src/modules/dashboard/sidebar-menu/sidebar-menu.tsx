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
  const { children: dashboardModules } = routes.modules.children.dashboard;
  const { sidebarMenu: sidebarMenuLocaleKeys } = localeKeys.dashboard;
  const menuList: MenuList[] = [
    {
      key: 'menu-group-1',
      label: t(sidebarMenuLocaleKeys.dashboardMenuGroup),
      type: 'group',
      children: [
        {
          key: dashboardModules.realTime.path,
          label: (
            <MenuNavigator
              pathname={`dashboard/${dashboardModules.realTime.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(sidebarMenuLocaleKeys.realTimeMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: dashboardModules.graphics.path,
          label: (
            <MenuNavigator
              pathname={`dashboard/${dashboardModules.graphics.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(sidebarMenuLocaleKeys.graphicsMenuItem)}
            </MenuNavigator>
          ),
          hasPermission: dashboardModules.graphics.hasPermission,
        },
        {
          key: dashboardModules.conversations.path,
          label: (
            <MenuNavigator
              pathname={`dashboard/${dashboardModules.conversations.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(sidebarMenuLocaleKeys.conversationsMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: dashboardModules.messages.path,
          label: (
            <MenuNavigator
              pathname={`dashboard/${dashboardModules.messages.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(sidebarMenuLocaleKeys.messagesMenuItem)}
            </MenuNavigator>
          ),
          hasPermission: dashboardModules.messages.hasPermission,
        },
        {
          key: dashboardModules.agents.path,
          label: (
            <MenuNavigator
              pathname={`dashboard/${dashboardModules.agents.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(sidebarMenuLocaleKeys.agentsMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: dashboardModules.ratings.path,
          label: (
            <MenuNavigator
              pathname={`dashboard/${dashboardModules.ratings.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(sidebarMenuLocaleKeys.ratingsMenuItem)}
            </MenuNavigator>
          ),
          hasPermission: dashboardModules.ratings.hasPermission,
          allowedRoles: dashboardModules.ratings.allowedRoles,
        },
        {
          key: dashboardModules.appointments.path,
          label: (
            <MenuNavigator
              pathname={`dashboard/${dashboardModules.appointments.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(sidebarMenuLocaleKeys.appointmentsMenuItem)}
            </MenuNavigator>
          ),
          hasPermission: dashboardModules.appointments.hasPermission,
          allowedRoles: dashboardModules.appointments.allowedRoles,
        },
        {
          key: dashboardModules.fallbacks.path,
          label: (
            <MenuNavigator
              pathname={`dashboard/${dashboardModules.fallbacks.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(sidebarMenuLocaleKeys.fallbacksMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: dashboardModules.fallbacks.allowedRoles,
        },
        {
          key: dashboardModules.categorizationDashboard.path,
          label: (
            <MenuNavigator
              pathname={dashboardModules.categorizationDashboard.path}
              appTypePort={AppTypePort.V2}
            >
              {t(sidebarMenuLocaleKeys.categorizationDashboardMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: dashboardModules.categorizationDashboard.allowedRoles,
          hasPermission: dashboardModules.categorizationDashboard.hasPermission,
        },
      ],
    },
    {
      key: 'menu-group-2',
      label: t(sidebarMenuLocaleKeys.sendingsMenuGroup),
      type: 'group',
      children: [
        {
          key: dashboardModules.sendingList.path,
          label: (
            <MenuNavigator
              pathname={dashboardModules.sendingList.path}
              appTypePort={AppTypePort.V2}
            >
              {t(sidebarMenuLocaleKeys.sendingListMenuItem)}
            </MenuNavigator>
          ),
          hasPermission: dashboardModules.sendingList.hasPermission,
          allowedRoles: dashboardModules.sendingList.allowedRoles,
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
