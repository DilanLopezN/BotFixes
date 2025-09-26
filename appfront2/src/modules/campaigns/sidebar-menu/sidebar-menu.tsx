import { Menu } from 'antd';
import type { ItemType } from 'antd/es/menu/interface';
import { useTranslation } from 'react-i18next';
import { MenuNavigator } from '~/components/menu-navigator';
import { useMenuWithPermissions } from '~/hooks/use-menu-with-permissions';
import { MenuList } from '~/hooks/use-menu-with-permissions/interfaces';
import { useOrganizationSettings } from '~/hooks/use-organization-settings';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes/constants';
import { AppTypePort } from '~/utils/redirect-app';

export const SidebarMenu = () => {
  const { t } = useTranslation();
  const { organizationSettings } = useOrganizationSettings();

  const { children: campaignsModules } = routes.modules.children.campaigns;
  const v2ModulesSettings = organizationSettings?.generalFeatureFlag?.v2Modules?.campaigns;

  const menuList: MenuList[] = [
    {
      key: 'menu-group-1',
      label: t(localeKeys.campaign.sidebarMenu.campaignMenuGroup),
      type: 'group',
      children: [
        {
          key: campaignsModules.broadcastList.path,
          label: (
            <MenuNavigator
              pathname={
                v2ModulesSettings?.broadcastList
                  ? campaignsModules.broadcastList.path
                  : `campaigns/`
              }
              appTypePort={v2ModulesSettings?.broadcastList ? AppTypePort.V2 : AppTypePort.APP}
            >
              {t(localeKeys.campaign.sidebarMenu.broadcastMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: campaignsModules.broadcastList.allowedRoles,
          hasPermission: campaignsModules.broadcastList.hasPermission,
        },
        {
          key: campaignsModules.customFlow.path,
          label: (
            <MenuNavigator
              pathname={`campaigns/${campaignsModules.customFlow.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.campaign.sidebarMenu.customFlowMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: campaignsModules.customFlow.allowedRoles,
          hasPermission: campaignsModules.customFlow.hasPermission,
        },
      ],
    },
    {
      key: 'menu-group-2',
      label: t(localeKeys.campaign.sidebarMenu.activeMessageMenuGroup),
      type: 'group',
      children: [
        {
          key: campaignsModules.activeMessageSettings.path,
          label: (
            <MenuNavigator
              pathname={`campaigns/${campaignsModules.activeMessageSettings.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.campaign.sidebarMenu.activeMessageMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: campaignsModules.activeMessageSettings.allowedRoles,
          hasPermission: campaignsModules.activeMessageSettings.hasPermission,
        },
        {
          key: campaignsModules.activeMessageStatus.path,
          label: (
            <MenuNavigator
              pathname={`campaigns/${campaignsModules.activeMessageStatus.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.campaign.sidebarMenu.activeMessageStatusMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: campaignsModules.activeMessageStatus.allowedRoles,
          hasPermission: campaignsModules.activeMessageStatus.hasPermission,
        },
      ],
    },
    {
      key: 'menu-group-3',
      label: t(localeKeys.campaign.sidebarMenu.emailMenuGroup),
      type: 'group',
      children: [
        {
          key: campaignsModules.emailSendingConfig.path,
          label: (
            <MenuNavigator
              pathname={`campaigns/${campaignsModules.emailSendingConfig.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.campaign.sidebarMenu.emailSendingConfigMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: campaignsModules.emailSendingConfig.allowedRoles,
          hasPermission: campaignsModules.emailSendingConfig.hasPermission,
        },
      ],
    },
    {
      key: 'menu-group-4',
      label: t(localeKeys.campaign.sidebarMenu.automaticSendingsMenuGroup),
      type: 'group',
      children: [
        {
          key: campaignsModules.cancelingReason.path,
          label: (
            <MenuNavigator
              pathname={`campaigns/${campaignsModules.cancelingReason.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.campaign.sidebarMenu.titleCancelingReason)}
            </MenuNavigator>
          ),
          allowedRoles: campaignsModules.cancelingReason.allowedRoles,
          hasPermission: campaignsModules.cancelingReason.hasPermission,
        },
        {
          key: campaignsModules.confirmationSettings.path,
          label: (
            <MenuNavigator
              pathname={`campaigns/${campaignsModules.confirmationSettings.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.campaign.sidebarMenu.configurationMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: campaignsModules.confirmationSettings.allowedRoles,
          hasPermission: campaignsModules.confirmationSettings.hasPermission,
        },
        {
          key: campaignsModules.confirmationRunners.path,
          label: (
            <MenuNavigator
              pathname={`admin/${campaignsModules.confirmationRunners.path}`}
              appTypePort={AppTypePort.ADMIN}
            >
              {t(localeKeys.campaign.sidebarMenu.runnersMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: campaignsModules.confirmationRunners.allowedRoles,
          hasPermission: campaignsModules.confirmationRunners.hasPermission,
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
