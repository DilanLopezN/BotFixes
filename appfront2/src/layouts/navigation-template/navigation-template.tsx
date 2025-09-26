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
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ClarityScript } from '~/components/clarity-script';
import { SpinnerContainer } from '~/components/spinner-container';
import { useAuth } from '~/hooks/use-auth';
import { useOrganizationSettings } from '~/hooks/use-organization-settings';
import { useSelectedWorkspace } from '~/hooks/use-selected-workspace';
import { localeKeys } from '~/i18n';
import {
  canViewCampaign,
  canViewSendingList,
  isAnySystemAdmin,
  isSystemAdmin,
  isWorkspaceAdmin,
} from '~/utils/permissions';
import { AppTypePort, redirectApp } from '~/utils/redirect-app';
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
  const nagivate = useNavigate();
  const { organizationSettings, isLoading } = useOrganizationSettings();

  const { name: workspaceName, _id: workspaceId, featureFlag } = selectedWorkspace;
  const { extensions, layout, helpCenter } = organizationSettings || {};
  const workspaceFeatureFlag = featureFlag || {};
  const optionsMap: OptionsMap = {
    dashboard: {
      title: t(localeKeys.navigationSideBar.dashboardMenuItem),
      path: '/dashboard',
      icon: DashboardIcon,
      onClick: () => {
        redirectApp({ pathname: 'dashboard/real-time', appTypePort: AppTypePort.APP });
      },
    },
    entities: {
      title: t(localeKeys.navigationSideBar.entitiesMenuItem),
      path: '/entities',
      icon: AiOutlineDatabase,
      onClick: () => {
        redirectApp({ pathname: 'entities', appTypePort: AppTypePort.APP });
      },
    },
    'live-agent': {
      title: t(localeKeys.navigationSideBar.liveAgentMenuItem),
      path: '/live-agent',
      icon: AiOutlineComment,
      onClick: () => {
        redirectApp({ pathname: 'live-agent', appTypePort: AppTypePort.APP });
      },
    },
    integrations: {
      title: t(localeKeys.navigationSideBar.integrationsMenuItem),
      path: '/integrations/settings',
      icon: AiOutlineAppstore,
      hasPermission: () => {
        if (workspaceFeatureFlag.enableModuleIntegrations || (user && isAnySystemAdmin(user))) {
          return true;
        }
        return false;
      },
      onClick: () => {
        redirectApp({
          pathname: 'integrations/settings',
          appTypePort: AppTypePort.APP,
        });
      },
    },
    settings: {
      title: t(localeKeys.navigationSideBar.settingsMenuItem),
      path: '/settings',
      icon: AiOutlineSetting,
      onClick: () => {
        nagivate('settings');
      },
    },
    customers: {
      title: t(localeKeys.navigationSideBar.customersMenuItem),
      path: '/customers/billing',
      icon: AiOutlineTeam,
      onClick: () => {
        if (user && !isSystemAdmin(user)) {
          redirectApp({
            pathname: '/admin/customers/customer-summary',
            appTypePort: AppTypePort.ADMIN,
          });
          return;
        }
        redirectApp({ pathname: 'customers/billing', appTypePort: AppTypePort.APP });
      },
    },
    campaigns: {
      title: t(localeKeys.navigationSideBar.campaignsMenuItem),
      path: '/campaigns',
      icon: CampaignIcon,
      hasPermission: () => {
        if (
          user &&
          ((isSystemAdmin(user) &&
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
      onClick: () => {
        redirectApp({ pathname: 'campaigns', appTypePort: AppTypePort.APP });
      },
    },
    trainerBot: {
      title: t(localeKeys.navigationSideBar.trainerBotMenuItem),
      path: '/trainer-bot',
      icon: AiOutlineRobot,
      onClick: () => {
        nagivate('trainer-bot/training');
      },
    },
  };

  const options = extensions?.reduce<NavigationProps[]>((previousValue, extension) => {
    const { extension: settingExtension, roles, enable } = extension;

    if (!enable) {
      return previousValue;
    }

    if (!user?.roles?.some((userRole) => roles.some((role) => role === userRole.role))) {
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
        <ClarityScript
          userId={user?._id}
          userName={user?.name}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
        />
      ) : null}
      <SideMenu style={{ background: layout?.color || '#84327a' }}>
        <TopLevelOptions>
          <LogoImageWrapper>
            <LogoImage title='Botdesigner' src='/v2/assets/img/botdesigner-min-logo.png' />
          </LogoImageWrapper>
          <Link
            to='/home'
            onClick={(event) => {
              event.preventDefault();
              redirectApp({ pathname: 'home', appTypePort: AppTypePort.APP });
            }}
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
            const isSelected = pathname.includes(element.path);

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
              <Link
                key={element.path}
                to={element.path}
                onClick={(e) => {
                  e.preventDefault();
                  if (element.onClick) {
                    element.onClick();
                  }
                }}
              >
                {render}
              </Link>
            );
          })}
        </TopLevelOptions>
        <BottomLevelOptions>
          <Anchor href={helpCenter?.url || ''} target='_blank'>
            <OptionItem selected={false} title={t(localeKeys.navigationSideBar.helpCenterMenuItem)}>
              <HelpCenterIcon />
            </OptionItem>
          </Anchor>
          <WorkspaceOption />
          <Link
            to='/profile'
            onClick={(event) => {
              event.preventDefault();
              redirectApp({ pathname: 'profile', appTypePort: AppTypePort.APP });
            }}
          >
            <OptionItem selected={false} title={t(localeKeys.navigationSideBar.profileMenuItem)}>
              <AiOutlineUser className='icon-menu' />
            </OptionItem>
          </Link>
        </BottomLevelOptions>
      </SideMenu>
      <ChildArea>
        <Outlet />
      </ChildArea>
    </Container>
  );
};
