import { ItemType } from 'antd/es/menu/interface';
import { useTranslation } from 'react-i18next';
import { MenuNavigator } from '~/components/menu-navigator';
import { useMenuWithPermissions } from '~/hooks/use-menu-with-permissions';
import { MenuList } from '~/hooks/use-menu-with-permissions/interfaces';
import { localeKeys } from '~/i18n';
import { routes } from '~/routes/constants';
import { AppTypePort } from '~/utils/redirect-app';
import { StyledMenu } from './styles';

export const SidebarMenu = () => {
  const { t } = useTranslation();
  const { children: settingsModules } = routes.modules.children.settings;
  const menuList: MenuList[] = [
    {
      key: 'menu-group-1',
      label: t(localeKeys.settings.sidebarMenu.configurationMenuGroup),
      type: 'group',
      children: [
        {
          key: settingsModules.users.path,
          label: (
            <MenuNavigator pathname={settingsModules.users.path} appTypePort={AppTypePort.V2}>
              {t(localeKeys.settings.sidebarMenu.usersMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: settingsModules.templates.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.templates.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.templatesMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: settingsModules.teams.path,
          label: (
            <MenuNavigator pathname={settingsModules.teams.path} appTypePort={AppTypePort.V2}>
              {t(localeKeys.settings.sidebarMenu.teamsMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: settingsModules.tags.path,
          label: (
            <MenuNavigator pathname={settingsModules.tags.path} appTypePort={AppTypePort.V2}>
              {t(localeKeys.settings.sidebarMenu.tagsMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.tags.allowedRoles,
        },
        {
          key: settingsModules.acessGroup.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.acessGroup.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.accessGroupMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: settingsModules.workspaceBillingSpecification.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.workspaceBillingSpecification.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.billingSpecificationMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.workspaceBillingSpecification.allowedRoles,
        },
        {
          key: settingsModules.generalSettings.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.generalSettings.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.generalSettingsMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: settingsModules.aiAgent.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.aiAgent.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.aiAgentMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.aiAgent.allowedRoles,
          hasPermission: settingsModules.aiAgent.hasPermission,
        },
        {
          key: settingsModules.privacyPolicy.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.privacyPolicy.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.privacyPolicyMenuItem)}
            </MenuNavigator>
          ),
        },
        {
          key: settingsModules.categorization.path,
          label: (
            <MenuNavigator
              pathname={settingsModules.categorization.path}
              appTypePort={AppTypePort.V2}
            >
              {t(localeKeys.settings.sidebarMenu.categorizationMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.categorization.allowedRoles,
          hasPermission: settingsModules.categorization.hasPermission,
        },
        {
          key: settingsModules.autoAssign.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.autoAssign.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.automaticallyAssignMenuItem)}
            </MenuNavigator>
          ),
          hasPermission: settingsModules.autoAssign.hasPermission,
        },
        {
          key: settingsModules.rating.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.rating.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.ratingMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.rating.allowedRoles,
          hasPermission: settingsModules.rating.hasPermission,
        },
        {
          key: settingsModules.billings.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.billings.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.billingsMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.billings.allowedRoles,
          hasPermission: settingsModules.billings.hasPermission,
        },
        {
          key: settingsModules.featureFlags.path,
          label: (
            <MenuNavigator
              pathname={`settings/${settingsModules.featureFlags.path}`}
              appTypePort={AppTypePort.APP}
            >
              {t(localeKeys.settings.sidebarMenu.featureFlagsMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.featureFlags.allowedRoles,
        },
        {
          key: settingsModules.breaks.path,
          label: (
            <MenuNavigator pathname={settingsModules.breaks.path} appTypePort={AppTypePort.V2}>
              {t(localeKeys.settings.sidebarMenu.breaksMenuItem)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.breaks.allowedRoles,
          hasPermission: settingsModules.breaks.hasPermission,
        },
        {
          key: settingsModules.whatsAppFlow.path,
          label: (
            <MenuNavigator
              pathname={settingsModules.whatsAppFlow.path}
              appTypePort={AppTypePort.V2}
            >
              {t(localeKeys.settings.sidebarMenu.whatsAppFlow)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.whatsAppFlow.allowedRoles,
          hasPermission: settingsModules.whatsAppFlow.hasPermission,
        },
        {
          key: settingsModules.remi.path,
          label: (
            <MenuNavigator pathname={settingsModules.remi.path} appTypePort={AppTypePort.V2}>
              {t(localeKeys.settings.sidebarMenu.remi)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.remi.allowedRoles,
          hasPermission: settingsModules.remi.hasPermission,
        },
        {
          key: settingsModules.automaticDistribution.path,
          label: (
            <MenuNavigator
              pathname={settingsModules.automaticDistribution.path}
              appTypePort={AppTypePort.V2}
            >
              {t(localeKeys.settings.sidebarMenu.automaticDistribution)}
            </MenuNavigator>
          ),
          allowedRoles: settingsModules.automaticDistribution.allowedRoles,
          hasPermission: settingsModules.automaticDistribution.hasPermission,
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
    <StyledMenu
      expandIcon={false}
      mode='inline'
      theme='light'
      items={normalizedMenu}
      selectedKeys={[selectedKey]}
    />
  );
};
