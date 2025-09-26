import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import Settings from './pages/settings';
import { UserPermission } from '../../utils/UserPermission';
import { PermissionResources, UserRoles } from 'kissbot-core';
import { TemplateTypeContextProvider } from './context';
import I18n from '../i18n/components/i18n';

class SettingsModuleClass extends Component<any> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        { path: '', isAuth: true, exact: true, component: Settings, title: this.props.getTranslation('Settings') },

        {
            path: '/users',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Users') + ' - ' + this.props.getTranslation('Settings'),
        },
        {
            path: '/templates',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Templates') + ' - ' + this.props.getTranslation('Settings'),
        },
        {
            path: '/templates/:templateId',
            isAuth: true,
            component: Settings,
            exact: true,
        },
        {
            path: '/teams',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Teams') + ' - ' + this.props.getTranslation('Settings'),
        },
        {
            path: '/tags',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Hang tags') + ' - ' + this.props.getTranslation('Settings'),
        },
        {
            path: '/tags/:tagsId',
            isAuth: true,
            component: Settings,
            exact: true,
        },
        {
            path: '/groups-access',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Groups access') + ' - ' + this.props.getTranslation('Settings'),
        },
        {
            path: '/groups-access/:groupsId',
            isAuth: true,
            component: Settings,
            exact: true,
        },
        {
            path: '/auto-assigns',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Auto assigns') + ' - ' + this.props.getTranslation('Settings'),
        },
        {
            path: '/auto-assigns/:autoAssignConversationId',
            isAuth: true,
            component: Settings,
            exact: true,
        },

        {
            path: '/privacy-policy',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Privacy policy') + ' - ' + this.props.getTranslation('Settings'),
        },
        {
            path: '/privacy-policy/:privacyPolicyId',
            isAuth: true,
            component: Settings,
            exact: true,
        },
        {
            path: '/rating',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Rating') + ' - ' + this.props.getTranslation('Settings'),
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
            path: '/general-settings',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('General Settings') + ' - ' + this.props.getTranslation('Settings'),
        },
        {
            path: '/sso-config',
            isAuth: true,
            component: Settings,
            exact: true,
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
            ]),
        },
        {
            path: '/workspace-billing-specification',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Billing specifications') + ' - ' + this.props.getTranslation('Settings'),
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_CS_ADMIN,
                },
            ]),
        },
        {
            path: '/billings',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Billings') + ' - ' + this.props.getTranslation('Settings'),
            canAccess: UserPermission.can([
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
                    role: UserRoles.SYSTEM_FARMER_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_CS_ADMIN,
                },
            ]),
        },
        {
            path: '/feature-flags',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Features') + ' - ' + this.props.getTranslation('Settings'),
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
        {
            path: '/ai-agent',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Agentes de IA') + ' - ' + this.props.getTranslation('Settings'),
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
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
        {
            path: '/ai-agent/:agentId/configure',
            isAuth: true,
            component: Settings,
            exact: true,
            title: this.props.getTranslation('Configure Agent') + ' - ' + this.props.getTranslation('Settings'),
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
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
    ];

    render() {
        return (
            <TemplateTypeContextProvider>
                <AppRouter match={this.props.match.path} routes={this.routes} />
            </TemplateTypeContextProvider>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const SettingsModule = I18n(withRouter(connect(mapStateToProps, {})(SettingsModuleClass)));
