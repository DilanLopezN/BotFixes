import { useTranslation } from 'react-i18next';
import {
  AiOutlineAppstore,
  AiOutlineComment,
  AiOutlineDatabase,
  AiOutlineHome,
  AiOutlineRobot,
  AiOutlineSetting,
  AiOutlineTeam,
  AiOutlineUser,
} from 'react-icons/ai';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BeamerScript } from '~/components/beamer-script';
import { ClarityScript } from '~/components/clarity-script';
import { SpinnerContainer } from '~/components/spinner-container';
import { StartBreakModal } from '~/components/start-break-modal';
import { UserRole } from '~/constants/user-roles';
import { useAuth } from '~/hooks/use-auth';
import { useOrganizationSettings } from '~/hooks/use-organization-settings';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { localeKeys } from '~/i18n';
import {
  canViewCampaign,
  canViewSendingList,
  isAnySystemAdmin,
  isSystemAdmin,
  isSystemCsAdmin,
  isWorkspaceAdmin,
} from '~/utils/permissions';
import { AppTypePort, getBaseUrl } from '~/utils/redirect-app';
import { CampaignIcon } from './icons/campaign-icon';
import { DashboardIcon } from './icons/dashboard-icon';
import { HelpCenterIcon } from './icons/help-center-icon';
import type { NavigationProps, OptionsMap } from './interfaces';
import {
  Anchor,
  BottomLevelOptions,
  ChildArea,
  Container,
  LogoImage,
  LogoImageWrapper,
  OptionItem,
  SideMenu,
  TopLevelOptions,
} from './styles';
import { WorkspaceOption } from './workspace-option';

export const NavigationTemplate = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const selectedWorkspace = useSelectedWorkspace();
  const { organizationSettings, isLoading } = useOrganizationSettings();

  const { name: workspaceName, _id: workspaceId, featureFlag } = selectedWorkspace;
  const { extensions, layout, helpCenter } = organizationSettings || {};
  const workspaceFeatureFlag = featureFlag || {};
  const optionsMap: OptionsMap = {
    dashboard: {
      id: 'dashboard',
      title: t(localeKeys.navigationSideBar.dashboardMenuItem),
      path: getBaseUrl({ pathname: '/dashboard/real-time', appTypePort: AppTypePort.APP }),
      icon: DashboardIcon,
    },
    entities: {
      id: 'entities',
      title: t(localeKeys.navigationSideBar.entitiesMenuItem),
      path: getBaseUrl({ pathname: '/entities', appTypePort: AppTypePort.APP }),
      icon: AiOutlineDatabase,
    },
    'live-agent': {
      id: 'live-agent',
      title: t(localeKeys.navigationSideBar.liveAgentMenuItem),
      path: getBaseUrl({ pathname: '/live-agent', appTypePort: AppTypePort.APP }),
      icon: AiOutlineComment,
    },
    integrations: {
      id: 'integrations',
      title: t(localeKeys.navigationSideBar.integrationsMenuItem),
      path: getBaseUrl({ pathname: '/integrations', appTypePort: AppTypePort.APP }),
      icon: AiOutlineAppstore,
      hasPermission: () => {
        if (workspaceFeatureFlag.enableModuleIntegrations || (user && isAnySystemAdmin(user))) {
          return true;
        }
        return false;
      },
    },
    settings: {
      id: 'settings',
      title: t(localeKeys.navigationSideBar.settingsMenuItem),
      path: getBaseUrl({ pathname: '/settings', appTypePort: AppTypePort.APP }),
      icon: AiOutlineSetting,
    },
    customers: {
      id: 'customers',
      title: t(localeKeys.navigationSideBar.customersMenuItem),
      path:
        user && !isSystemAdmin(user)
          ? getBaseUrl({
              pathname: '/admin/customers/customer-summary',
              appTypePort: AppTypePort.ADMIN,
            })
          : getBaseUrl({ pathname: '/customers/billing', appTypePort: AppTypePort.APP }),
      icon: AiOutlineTeam,
    },
    campaigns: {
      id: 'campaigns',
      title: t(localeKeys.navigationSideBar.campaignsMenuItem),
      path: getBaseUrl({
        pathname: '/campaigns',
        appTypePort: AppTypePort.APP,
      }),
      icon: CampaignIcon,
      hasPermission: () => {
        if (
          user &&
          ((isSystemAdmin(user) &&
            (workspaceFeatureFlag.campaign || workspaceFeatureFlag.activeMessage)) ||
            (isSystemCsAdmin(user) &&
              (workspaceFeatureFlag.campaign || workspaceFeatureFlag.activeMessage)) ||
            (isAnySystemAdmin(user) && workspaceFeatureFlag.campaign) ||
            (isWorkspaceAdmin(user, workspaceId) && workspaceFeatureFlag.campaign) ||
            (workspaceFeatureFlag.campaign && canViewCampaign(user, selectedWorkspace)) ||
            (workspaceFeatureFlag.enableConfirmation &&
              canViewSendingList(user, selectedWorkspace)))
        ) {
          return true;
        }
        return false;
      },
    },
    trainerBot: {
      id: 'trainer-bot',
      title: t(localeKeys.navigationSideBar.trainerBotMenuItem),
      path: getBaseUrl({
        pathname: '/trainer-bot/training',
        appTypePort: AppTypePort.V2,
      }),
      icon: AiOutlineRobot,
    },
  };

  const options = extensions?.reduce<NavigationProps[]>((previousValue, extension) => {
    const { extension: settingExtension, roles, enable } = extension;

    if (!enable) {
      return previousValue;
    }

    if (
      !user?.roles?.some((userRole) =>
        roles.some((role) => {
          if (
            (role === UserRole.WORKSPACE_ADMIN || role === UserRole.DASHBOARD_ADMIN) &&
            role === userRole.role
          ) {
            return userRole.resourceId === selectedWorkspace._id;
          }

          return role === userRole.role;
        })
      )
    ) {
      return previousValue;
    }

    const option = optionsMap[settingExtension as keyof typeof optionsMap];

    if (!option || (option.hasPermission && !option.hasPermission())) {
      return previousValue;
    }

    return [...previousValue, option];
  }, []);

  if (isLoading) {
    return <SpinnerContainer message='Carregando configurações...' />;
  }

  return (
    <Container>
      {process.env.NODE_ENV === 'production' ? (
        <>
          <BeamerScript />
          <ClarityScript
            userId={user?._id}
            userName={user?.name}
            workspaceId={workspaceId}
            workspaceName={workspaceName}
          />
        </>
      ) : null}
      <SideMenu style={{ background: layout?.color || '#84327a' }}>
        <TopLevelOptions>
          <LogoImageWrapper>
            <LogoImage title='Botdesigner' src='/v2/assets/img/botdesigner-min-logo.png' />
          </LogoImageWrapper>
          <Link
            to={getBaseUrl({
              pathname: '/home',
              appTypePort: AppTypePort.APP,
            })}
          >
            <OptionItem
              selected={pathname.includes('/home')}
              title={t(localeKeys.navigationSideBar.homeMenuItem)}
            >
              <AiOutlineHome className='icon-menu' />
            </OptionItem>
          </Link>
          {options?.map((element) => {
            const Icon = element.icon;
            const isSelected = pathname.includes(element.id);

            const render = (
              <OptionItem
                key={element.path}
                selected={isSelected}
                title={element.title}
                tabIndex={-1}
              >
                <Icon className='icon-menu' />
              </OptionItem>
            );

            return (
              <Link key={element.path} to={element.path}>
                {render}
              </Link>
            );
          })}
        </TopLevelOptions>
        <BottomLevelOptions>
          <OptionItem selected={false} className='beamerTrigger' title={t('Avisos')}>
            <IoMdNotificationsOutline className='icon-menu' />
          </OptionItem>
          <Anchor href={helpCenter?.url || ''} target='_blank'>
            <OptionItem selected={false} title={t(localeKeys.navigationSideBar.helpCenterMenuItem)}>
              <HelpCenterIcon />
            </OptionItem>
          </Anchor>
          <WorkspaceOption />
          <Link
            to={getBaseUrl({
              pathname: '/profile',
              appTypePort: AppTypePort.APP,
            })}
          >
            <OptionItem selected={false} title={t(localeKeys.navigationSideBar.profileMenuItem)}>
              <AiOutlineUser className='icon-menu' />
            </OptionItem>
          </Link>
          <StartBreakModal />
        </BottomLevelOptions>
      </SideMenu>
      <ChildArea>
        <Outlet />
      </ChildArea>
    </Container>
  );
};
