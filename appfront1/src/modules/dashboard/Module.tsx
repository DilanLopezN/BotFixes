import { PermissionResources, UserRoles } from 'kissbot-core';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { AppRouter } from '../../Routes';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { UserPermission } from '../../utils/UserPermission';
import I18n from '../i18n/components/i18n';
import { TeamsContextProvider } from './context';
import { Dashboard } from './pages/Dashboard/Dashboard';

class DashboardModuleClass extends Component<any> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        { path: '', isAuth: true, exact: true, component: Dashboard },
        {
            path: '/real-time',
            isAuth: true,
            component: Dashboard,
            exact: true,
            title: this.props.getTranslation('Real time') + ' - Dashboard',
        },
        {
            path: '/conversations',
            isAuth: true,
            component: Dashboard,
            exact: true,
            title: this.props.getTranslation('Conversations') + ' - Dashboard',
        },
        {
            path: '/graphics',
            isAuth: true,
            component: Dashboard,
            exact: true,
            title: this.props.getTranslation('My reports') + ' - Dashboard',
        },
        {
            path: '/messages',
            isAuth: true,
            component: Dashboard,
            exact: true,
            title: this.props.getTranslation('Messages') + ' - Dashboard',
        },
        {
            path: '/agents',
            isAuth: true,
            component: Dashboard,
            exact: true,
            title: this.props.getTranslation('Agents') + ' - Dashboard',
        },
        {
            path: '/ratings',
            isAuth: true,
            component: Dashboard,
            exact: true,
            title: this.props.getTranslation('Ratings') + ' - Dashboard',
            canAccess:
                this.props.selectedWorkspace?.generalConfigs?.enableRating ||
                UserPermission.can([
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
                ]),
        },
        {
            path: '/appointments',
            isAuth: true,
            component: Dashboard,
            exact: true,
            title: this.props.getTranslation('Appointments') + ' - Dashboard',
            canAccess: UserPermission.can([
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
            ]),
        },
        {
            path: '/fallbacks',
            isAuth: true,
            component: Dashboard,
            exact: true,
            title: ' Fallbacks - Dashboard',
            canAccess: UserPermission.can([
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
            ]),
        },
    ];

    render() {
        return (
            <TeamsContextProvider>
                <AppRouter match={this.props.match.path} routes={this.routes} />;
            </TeamsContextProvider>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export const DashboardModule = I18n(withRouter(connect(mapStateToProps, {})(DashboardModuleClass)));
