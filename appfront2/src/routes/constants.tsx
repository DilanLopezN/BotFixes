import { RedirectApp } from '~/components/redirect';
import { PermissionResources } from '~/constants/permission-resources';
import { UserRoles } from '~/constants/user-roles';
import { NavigationTemplate } from '~/layouts/navigation-template';
import { Campaigns } from '~/modules/campaigns';
import { BroadcastList } from '~/modules/campaigns/broadcast-list';
import { ViewBroadcastList } from '~/modules/campaigns/broadcast-list/pages/broadcast-grid';
import { CreateBroadcastList } from '~/modules/campaigns/broadcast-list/pages/create-broadcast-list';
import { EditBroadcastList } from '~/modules/campaigns/broadcast-list/pages/edit-broadcast-list';
import { Dashboard } from '~/modules/dashboard';
import { CategorizationDashboard } from '~/modules/dashboard/categorization-dashboard';
import { CategorizationDashboardList } from '~/modules/dashboard/categorization-dashboard/pages/categorization-list';
import { SendingList } from '~/modules/dashboard/sending-list';
import { Dashboard as SendingListDashboard } from '~/modules/dashboard/sending-list/pages/dashboard';
import { FullTable as SendingListFullTable } from '~/modules/dashboard/sending-list/pages/full-table/full-table';
import { Login } from '~/modules/login';
import { Categorization } from '~/modules/settings/categorization';
import { CategorizationList } from '~/modules/settings/categorization/pages/categorization-list';
import { Settings } from '~/modules/settings/settings';
import { Teams } from '~/modules/settings/teams';
import { CreateNewTeam } from '~/modules/settings/teams/pages/create-new-team';
import { TeamList } from '~/modules/settings/teams/pages/team-list';
import { ViewTeam } from '~/modules/settings/teams/pages/view-team';
import { Users } from '~/modules/settings/users';
import { UserCreateForm } from '~/modules/settings/users/user-create-form';
import { UserList } from '~/modules/settings/users/user-list';
import { UserUpdateForm } from '~/modules/settings/users/user-update-form';
import { TrainerBot } from '~/modules/trainer-bot';
import { Training } from '~/modules/trainer-bot/training';
import { CreateTrainer } from '~/modules/trainer-bot/training/pages/create-trainer';
import { TrainingList } from '~/modules/trainer-bot/training/pages/training-list';
import { ViewTrainer } from '~/modules/trainer-bot/training/pages/view-trainer';
import {
  canViewCampaign,
  canViewSendingList,
  isAnySystemAdmin,
  isSystemAdmin,
  isSystemCsAdmin,
  isSystemDevAdmin,
} from '~/utils/permissions';
import { AppTypePort } from '~/utils/redirect-app';
import { BaseRoute } from './base-route';
import { generateRouteWithFullPath } from './generate-route-with-full-path';

export enum RouteType {
  none,
  auth,
  notAuth,
}

export const routes = generateRouteWithFullPath({
  home: { path: '', element: <BaseRoute />, fullPath: '' },
  login: { path: 'login', element: <Login />, type: RouteType.notAuth, fullPath: '' },
  modules: {
    path: ':workspaceId',
    element: <NavigationTemplate />,
    type: RouteType.auth,
    fullPath: '',
    children: {
      dashboard: {
        path: 'dashboard',
        fullPath: '',
        element: <Dashboard />,
        children: {
          noMatch: {
            path: '*',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
          realTime: {
            path: 'real-time',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
          conversations: {
            path: 'conversations',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
          agents: {
            path: 'agents',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
          fallbacks: {
            path: 'fallbacks',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_UX_ADMIN,
              },
            ],
          },
          messages: {
            path: 'messages',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.dashboardMessages || isSystemAdmin(user);
            },
          },
          graphics: {
            path: 'graphics',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.dashboardNewVersion || isSystemAdmin(user);
            },
          },
          ratings: {
            path: 'ratings',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.DASHBOARD_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.rating || isSystemAdmin(user);
            },
          },
          appointments: {
            path: 'appointments',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.dashboardAppointments || isSystemAdmin(user);
            },
          },
          sendingList: {
            path: 'sending-list',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_AGENT,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (
                isSystemAdmin(user) ||
                isSystemDevAdmin(user) ||
                (workspace.featureFlag?.enableConfirmation && canViewSendingList(user, workspace))
              );
            },
            element: <SendingList />,
            children: {
              dashboard: {
                path: '',
                element: <SendingListDashboard />,
                fullPath: '',
              },
              fullTable: {
                path: 'full-table',
                element: <SendingListFullTable />,
                fullPath: '',
              },
            },
            fullPath: '',
          },
          categorizationDashboard: {
            path: 'categorization-dashboard',
            element: <CategorizationDashboard />,
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
            ],
            hasPermission: undefined,
            fullPath: '',
            children: {
              categorizationDashboard: {
                path: '',
                element: <CategorizationDashboardList />,
                fullPath: '',
              },
            },
          },
        },
      },
      campaigns: {
        path: 'campaigns',
        element: <Campaigns />,
        children: {
          noMatch: {
            path: '*',
            element: (
              <RedirectApp pathname='/campaigns/broadcast-list' appTypePort={AppTypePort.V2} />
            ),
            fullPath: '',
          },
          home: {
            path: '',
            element: (
              <RedirectApp pathname='/campaigns/broadcast-list' appTypePort={AppTypePort.V2} />
            ),
            fullPath: '',
          },
          sendingList: {
            path: 'sending-list',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_AGENT,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (
                isSystemAdmin(user) ||
                isSystemDevAdmin(user) ||
                (workspace.featureFlag?.enableConfirmation && canViewSendingList(user, workspace))
              );
            },
            element: (
              <RedirectApp
                pathname='/dashboard/sending-list?showAlert=true'
                appTypePort={AppTypePort.V2}
              />
            ),
            fullPath: '',
          },
          broadcastList: {
            path: 'broadcast-list',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_AGENT,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.campaign && canViewCampaign(user, workspace);
            },
            element: <BroadcastList />,
            fullPath: '',
            children: {
              viewBroadcastList: {
                path: '',
                element: <ViewBroadcastList />,
                fullPath: '',
              },
              createBroadcastList: {
                path: 'create-new-broadcast-list',
                element: <CreateBroadcastList />,
                fullPath: '',
              },
              cloneBroadcastList: {
                path: 'create-new-broadcast-list/:broadcastListId',
                element: <CreateBroadcastList />,
                fullPath: '',
              },
              editBroadcastList: {
                path: ':broadcastListId',
                element: <EditBroadcastList />,
                fullPath: '',
              },
            },
          },
          customFlow: {
            path: 'custom-flow',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.campaign && canViewCampaign(user, workspace);
            },
            element: null,
            fullPath: '',
          },
          activeMessageSettings: {
            path: 'active-message-settings',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (workspace && isSystemAdmin(user)) || isSystemDevAdmin(user);
            },
            element: null,
            fullPath: '',
          },
          activeMessageStatus: {
            path: 'active-message-status',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (workspace && isSystemAdmin(user)) || isSystemDevAdmin(user);
            },
            element: null,
            fullPath: '',
          },
          confirmationSettings: {
            path: 'confirmation-settings',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (
                isSystemAdmin(user) ||
                isSystemDevAdmin(user) ||
                (workspace.featureFlag?.enableConfirmation && canViewSendingList(user, workspace))
              );
            },
            element: null,
            fullPath: '',
          },
          cancelingReason: {
            path: 'cancel-reason',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
            ],
            hasPermission: (user) => {
              return isSystemAdmin(user) || isSystemDevAdmin(user) || isSystemCsAdmin(user);
            },
            element: null,
            fullPath: '',
          },
          confirmationRunners: {
            path: 'confirmation/runners',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (
                isSystemAdmin(user) ||
                isSystemDevAdmin(user) ||
                (workspace.featureFlag?.enableConfirmation && canViewSendingList(user, workspace))
              );
            },
            element: null,
            fullPath: '',
          },
          emailSendingConfig: {
            path: 'email-sending-settings',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return isSystemAdmin(user) || isSystemDevAdmin(user);
            },
            element: <RedirectApp pathname='/campaigns' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
        },
        fullPath: '',
      },
      settings: {
        path: 'settings',
        element: <Settings />,
        children: {
          noMatch: {
            path: '*',
            element: <RedirectApp pathname='/settings' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
          home: {
            path: '',
            element: <RedirectApp pathname='/settings' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
          users: {
            path: 'users',
            element: <Users />,
            fullPath: '',
            children: {
              userList: {
                path: '',
                element: <UserList />,
                fullPath: '',
              },
              createUser: {
                path: 'create-user',
                element: <UserCreateForm />,
                fullPath: '',
              },
              updateUser: {
                path: ':userId',
                element: <UserUpdateForm />,
                fullPath: '',
              },
            },
          },
          templates: {
            path: 'templates',
            element: null,
            fullPath: '',
          },
          teams: {
            path: 'teams',
            element: <Teams />,
            fullPath: '',
            children: {
              teamList: {
                path: '',
                element: <TeamList />,
                fullPath: '',
              },
              createNewTeam: {
                path: 'create-new-team',
                element: <CreateNewTeam />,
                fullPath: '',
              },
              viewTeam: {
                path: ':teamId',
                element: <ViewTeam />,
                fullPath: '',
              },
            },
          },
          tags: {
            path: 'tags',
            element: null,
            fullPath: '',
          },
          acessGroup: {
            path: 'groups-access',
            element: null,
            fullPath: '',
          },
          workspaceBillingSpecification: {
            path: 'workspace-billing-specification',
            element: null,
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
            ],
            fullPath: '',
          },
          generalSettings: {
            path: 'general-settings',
            element: null,
            fullPath: '',
          },
          privacyPolicy: {
            path: 'privacy-policy',
            element: null,
            fullPath: '',
          },
          autoAssign: {
            path: 'auto-assigns',
            element: null,
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.enableAutoAssign;
            },
            fullPath: '',
          },
          rating: {
            path: 'rating',
            element: null,
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.rating || isAnySystemAdmin(user);
            },
            fullPath: '',
          },
          billings: {
            path: 'billings',
            element: null,
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return workspace.featureFlag?.enableModuleBillings || isSystemAdmin(user);
            },
            fullPath: '',
          },
          featureFlags: {
            path: 'feature-flags',
            element: null,
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_UX_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return isAnySystemAdmin(user);
            },
            fullPath: '',
          },
          categorization: {
            path: 'categorization',
            element: <Categorization />,
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResources.WORKSPACE,
                role: UserRoles.WORKSPACE_ADMIN,
              },
            ],
            hasPermission: undefined,
            fullPath: '',
            children: {
              home: {
                path: '',
                element: (
                  <RedirectApp
                    pathname='/settings/categorization/objectives'
                    appTypePort={AppTypePort.V2}
                  />
                ),
                fullPath: '',
              },
              categorizationList: {
                path: ':categorizationType',
                element: <CategorizationList />,
                fullPath: '',
              },
            },
          },
        },
        fullPath: '',
      },
      trainerBot: {
        path: 'trainer-bot',
        fullPath: '',
        element: <TrainerBot />,
        allowedRoles: [
          {
            resource: PermissionResources.ANY,
            role: UserRoles.SYSTEM_ADMIN,
          },
          {
            resource: PermissionResources.ANY,
            role: UserRoles.SYSTEM_DEV_ADMIN,
          },
        ],
        hasPermission: (user, workspace) => {
          return isSystemDevAdmin(user) || isSystemAdmin(user);
        },
        children: {
          noMatch: {
            path: '*',
            element: <RedirectApp pathname='/trainer-bot' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
          training: {
            path: 'training',
            element: <Training />,
            fullPath: '',
            allowedRoles: [
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResources.ANY,
                role: UserRoles.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return isSystemDevAdmin(user) || isSystemAdmin(user);
            },
            children: {
              home: {
                path: '',
                element: <TrainingList />,
                fullPath: '',
              },
              createNewTrainer: {
                path: 'create-trainer',
                element: <CreateTrainer />,
                fullPath: '',
              },
              viewTrainer: {
                path: ':trainerId',
                element: <ViewTrainer />,
                fullPath: '',
              },
            },
          },
        },
      },
    },
  },
});
