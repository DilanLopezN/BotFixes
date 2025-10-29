import { RedirectApp } from '~/components/redirect';
import { PermissionResource } from '~/constants/permission-resources';
import { UserRole } from '~/constants/user-roles';
import { NavigationTemplate } from '~/layouts/navigation-template';
import { Campaigns } from '~/modules/campaigns';
import { BroadcastList } from '~/modules/campaigns/broadcast-list';
import { ViewBroadcastList } from '~/modules/campaigns/broadcast-list/pages/broadcast-grid';
import { CreateBroadcastList } from '~/modules/campaigns/broadcast-list/pages/create-broadcast-list';
import { EditBroadcastList } from '~/modules/campaigns/broadcast-list/pages/edit-broadcast-list';
import { Dashboard } from '~/modules/dashboard';
import { AppointmentTable } from '~/modules/dashboard/appointment-table';
import { AppointmentReports } from '~/modules/dashboard/appointment-table/pages/appointment-reports';
import { BreakDashboard } from '~/modules/dashboard/break-dashboard';
import { BreakReports } from '~/modules/dashboard/break-dashboard/pages/break-reports';
import { CategorizationDashboard } from '~/modules/dashboard/categorization-dashboard';
import { CategorizationDashboardList } from '~/modules/dashboard/categorization-dashboard/pages/categorization-list';
import { RatingDashboard } from '~/modules/dashboard/rating-dashboard';
import { RatingDashboardList } from '~/modules/dashboard/rating-dashboard/pages/rating-list';
import { RemiDashboard } from '~/modules/dashboard/remi-dashboard';
import { RemiReports } from '~/modules/dashboard/remi-dashboard/pages/remi-reports';
import { SendingList } from '~/modules/dashboard/sending-list';
import { Dashboard as SendingListDashboard } from '~/modules/dashboard/sending-list/pages/dashboard';
import { FullTable as SendingListFullTable } from '~/modules/dashboard/sending-list/pages/full-table/full-table';
import { Login } from '~/modules/login';
import { RecoverMail } from '~/modules/login/recover/recover-email';
import { RecoverPassword } from '~/modules/login/recover/recover-password';
import { AutomaticDistribution } from '~/modules/settings/automatic-distribution';
import { AutomaticDistributionConversation } from '~/modules/settings/automatic-distribution/pages/automatic-distribution';
import { Breaks } from '~/modules/settings/breaks';
import { BreakList } from '~/modules/settings/breaks/pages/break-list';
import { Categorization } from '~/modules/settings/categorization';
import { CategorizationList } from '~/modules/settings/categorization/pages/categorization-list';
import { Remi } from '~/modules/settings/remi';
import { RemiCreateForm } from '~/modules/settings/remi/components/remi-create-form';
import { RemiUpdateForm } from '~/modules/settings/remi/components/remi-update-form';
import { RemiList } from '~/modules/settings/remi/pages/remi-list';
import { Settings } from '~/modules/settings/settings';
import { Tags } from '~/modules/settings/tags';
import { CreateTagPage } from '~/modules/settings/tags/pages/create-tag-page/create-tag-page';
import { TagsList } from '~/modules/settings/tags/pages/tags-list';
import { Teams } from '~/modules/settings/teams';
import { CreateNewTeam } from '~/modules/settings/teams/pages/create-new-team';
import { TeamList } from '~/modules/settings/teams/pages/team-list';
import { ViewTeam } from '~/modules/settings/teams/pages/view-team';
import { Users } from '~/modules/settings/users';
import { UserCreateForm } from '~/modules/settings/users/user-create-form';
import { UserList } from '~/modules/settings/users/user-list';
import { UserUpdateForm } from '~/modules/settings/users/user-update-form';
import { WhatsAppFlow } from '~/modules/settings/whatsapp-flow';
import { FlowTemplateEditor } from '~/modules/settings/whatsapp-flow/components/flow-template-editor';
import { WhatsAppFlowList } from '~/modules/settings/whatsapp-flow/pages/whatsapp-flow-list';
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
  isSystemSupportAdmin,
  isWorkspaceAdmin,
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
  recoverMail: { path: 'recover/email/:token', element: <RecoverMail />, fullPath: '' },
  recoverPassword: { path: 'recover/password/:token', element: <RecoverPassword />, fullPath: '' },
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
            ],
          },
          breakDashboard: {
            path: 'breaks',
            element: <BreakDashboard />,
            fullPath: '',
            allowedRoles: undefined,
            hasPermission: (user, workspace) => {
              if (
                workspace?.advancedModuleFeatures?.enableAgentStatus &&
                isWorkspaceAdmin(user, workspace._id)
              ) {
                return true;
              }

              if (isAnySystemAdmin(user)) {
                return true;
              }

              return false;
            },
            children: {
              home: {
                path: '',
                element: (
                  <RedirectApp pathname='/dashboard/breaks/metrics' appTypePort={AppTypePort.V2} />
                ),
                fullPath: '',
              },
              metrics: {
                path: 'metrics',
                element: (
                  <RedirectApp
                    pathname='/dashboard/breaks/metrics/overall-productivity'
                    appTypePort={AppTypePort.V2}
                  />
                ),
                fullPath: '',
              },
              breakReports: {
                path: ':tabId',
                element: <BreakReports />,
                fullPath: '',
              },
              breakReportTabs: {
                path: ':tabId/:subTabId',
                element: <BreakReports />,
                fullPath: '',
              },
            },
          },
          remiDashboard: {
            path: 'remi',
            element: <RemiDashboard />,
            fullPath: '',
            allowedRoles: undefined,
            hasPermission: (user, workspace) => {
              if (workspace.featureFlag?.enableRemi && isWorkspaceAdmin(user, workspace._id)) {
                return true;
              }

              if (isAnySystemAdmin(user)) {
                return true;
              }

              return false;
            },
            children: {
              home: {
                path: '',
                element: <RemiReports />,
                fullPath: '',
              },
            },
          },
          appointmentTable: {
            path: 'appointment-table',
            element: <AppointmentTable />,
            fullPath: '',
            allowedRoles: undefined,
            hasPermission: (user, workspace) => {
              if (isAnySystemAdmin(user)) {
                return true;
              }

              return false;
            },
            children: {
              home: {
                path: '',
                element: <AppointmentReports />,
                fullPath: '',
              },
            },
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
            element: <RatingDashboard />,
            fullPath: '',
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.DASHBOARD_ADMIN,
              },
            ],
            children: {
              categorizationDashboard: {
                path: '',
                element: <RatingDashboardList />,
                fullPath: '',
              },
            },
            hasPermission: undefined,
          },
          appointments: {
            path: 'appointments',
            element: <RedirectApp pathname='/dashboard' appTypePort={AppTypePort.APP} />,
            fullPath: '',
          },
          sendingList: {
            path: 'sending-list',
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_AGENT,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_AGENT,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_AGENT,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_SUPPORT_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (
                (workspace && isSystemAdmin(user)) ||
                isSystemDevAdmin(user) ||
                isSystemSupportAdmin(user)
              );
            },
            element: null,
            fullPath: '',
          },
          activeMessageStatus: {
            path: 'active-message-status',
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_SUPPORT_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (
                (workspace && isSystemAdmin(user)) ||
                isSystemDevAdmin(user) ||
                isSystemSupportAdmin(user)
              );
            },
            element: null,
            fullPath: '',
          },
          confirmationSettings: {
            path: 'confirmation-settings',
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_SUPPORT_ADMIN,
              },
            ],
            hasPermission: (user) => {
              return (
                isSystemAdmin(user) ||
                isSystemDevAdmin(user) ||
                isSystemCsAdmin(user) ||
                isSystemSupportAdmin(user)
              );
            },
            element: null,
            fullPath: '',
          },
          confirmationRunners: {
            path: 'confirmation/runners',
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
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
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
            ],
            element: <Tags />,
            fullPath: '',
            children: {
              tagsList: {
                path: '',
                element: <TagsList />,
                fullPath: '',
              },
              createTag: {
                path: 'create-new-tag',
                element: <CreateTagPage />,
                fullPath: '',
              },
            },
          },
          breaks: {
            path: 'breaks',
            element: <Breaks />,
            fullPath: '',
            allowedRoles: undefined,
            hasPermission: (user, workspace) => {
              if (
                workspace?.advancedModuleFeatures?.enableAgentStatus &&
                isWorkspaceAdmin(user, workspace._id)
              ) {
                return true;
              }

              if (isAnySystemAdmin(user)) {
                return true;
              }

              return false;
            },
            children: {
              breakList: {
                path: '',
                element: <BreakList />,
                fullPath: '',
              },
            },
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
            ],
            fullPath: '',
          },
          generalSettings: {
            path: 'general-settings',
            element: null,
            fullPath: '',
          },
          aiAgent: {
            path: 'ai-agent',
            element: null,
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
            ],
            hasPermission: undefined,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
            ],
            hasPermission: (user, workspace) => {
              return (
                workspace.featureFlag?.enableModuleBillings ||
                isSystemAdmin(user) ||
                isSystemCsAdmin(user)
              );
            },
            fullPath: '',
          },
          featureFlags: {
            path: 'feature-flags',
            element: null,
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
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
          whatsAppFlow: {
            path: 'whatsapp-flow',
            element: <WhatsAppFlow />,
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
            ],
            fullPath: '',
            hasPermission: (user, workspace) => {
              return (
                isSystemAdmin(user) ||
                isSystemDevAdmin(user) ||
                workspace.featureFlag?.enableModuleWhatsappFlow
              );
            },
            children: {
              home: {
                path: '',
                element: <WhatsAppFlowList />,
                fullPath: '',
              },
              viewWhatsAppFlow: {
                path: ':flowId',
                element: <FlowTemplateEditor />,
                fullPath: '',
              },
            },
          },
          remi: {
            path: 'remi',
            element: <Remi />,
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
            ],
            fullPath: '',
            hasPermission: (user, workspace) => {
              return isSystemAdmin(user) || workspace.featureFlag?.enableRemi;
            },
            children: {
              home: {
                path: '',
                element: <RemiList />,
                fullPath: '',
              },
              remiConfig: {
                path: 'create',
                element: <RemiCreateForm />,
                fullPath: '',
              },
              remiUpdate: {
                path: ':remiId',
                element: <RemiUpdateForm />,
                fullPath: '',
              },
            },
          },
          automaticDistribution: {
            path: 'automatic-distribution',
            element: <AutomaticDistributionConversation />,
            allowedRoles: [
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_CS_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_UX_ADMIN,
              },
              {
                resource: PermissionResource.WORKSPACE,
                role: UserRole.WORKSPACE_ADMIN,
              },
            ],
            fullPath: '',
            hasPermission: (user, workspace) => {
              return isSystemAdmin(user) || workspace.featureFlag?.enableAutomaticDistribution;
            },
            children: {
              home: {
                path: '',
                element: <AutomaticDistribution />,
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
            resource: PermissionResource.ANY,
            role: UserRole.SYSTEM_ADMIN,
          },
          {
            resource: PermissionResource.ANY,
            role: UserRole.SYSTEM_DEV_ADMIN,
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
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_ADMIN,
              },
              {
                resource: PermissionResource.ANY,
                role: UserRole.SYSTEM_DEV_ADMIN,
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
