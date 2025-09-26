import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import Campaigns from './page/index';
import { UserPermission, FeatureFlagPermission, canViewCampaign, canViewSendingList } from '../../utils/UserPermission';
import { PermissionResources, UserRoles } from 'kissbot-core';
import I18n from '../i18n/components/i18n';

class CampaignsModuleClass extends Component<any> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        {
            path: '',
            isAuth: true,
            component: Campaigns,
            exact: true,
            title: this.props.getTranslation('Broadcast list') + ' - ' + this.props.getTranslation('Campaign'),
            canAccess:
                UserPermission.can([
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
                ]) &&
                FeatureFlagPermission.can('campaign') &&
                canViewCampaign.can(),
        },
        {
            path: '/active-message-settings',
            isAuth: true,
            component: Campaigns,
            exact: true,
            title: this.props.getTranslation('Active message') + ' - ' + this.props.getTranslation('Campaign'),
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
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
        {
            path: '/active-message-settings/:activeMessageId',
            isAuth: true,
            component: Campaigns,
            exact: true,
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
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
        {
            path: '/custom-flow',
            isAuth: true,
            component: Campaigns,
            exact: true,
            title: this.props.getTranslation('Custom flow') + ' - ' + this.props.getTranslation('Campaign'),
            canAccess:
                UserPermission.can([
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
                        resource: PermissionResources.ANY,
                        role: UserRoles.SYSTEM_UX_ADMIN,
                    },
                ]) && FeatureFlagPermission.can('campaign'),
        },
        {
            path: '/active-message-status',
            isAuth: true,
            component: Campaigns,
            exact: true,
            title: this.props.getTranslation('Active message status') + ' - ' + this.props.getTranslation('Campaign'),
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
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
        {
            path: '/id/:campaignId',
            isAuth: true,
            component: Campaigns,
            exact: true,
            canAccess:
                UserPermission.can([
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
                ]) &&
                FeatureFlagPermission.can('campaign') &&
                canViewCampaign.can(),
        },
        {
            path: '/confirmation-settings',
            isAuth: true,
            component: Campaigns,
            exact: true,
            title: this.props.getTranslation('Settings') + ' - ' + this.props.getTranslation('Campaign'),
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
        {
            path: '/confirmation-settings/:scheduleSettingId',
            isAuth: true,
            component: Campaigns,
            exact: true,
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
        {
            path: '/shipping-list',
            title: this.props.getTranslation('Shipping List'),
            isAuth: true,
            component: Campaigns,
            exact: true,
            canAccess:
                UserPermission.can([
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
                    {
                        resource: PermissionResources.WORKSPACE,
                        role: UserRoles.WORKSPACE_AGENT,
                    },
                ]) &&
                FeatureFlagPermission.can('enableConfirmation') &&
                canViewSendingList.can(),
        },
        {
            path: '/cancel-reason',
            isAuth: true,
            component: Campaigns,
            exact: true,
            title: this.props.getTranslation('Motivo de cancelamento') + ' - ' + this.props.getTranslation('Campaign'),
            canAccess: UserPermission.can([
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
            ]),
        },
        {
            path: '/email-sending-settings',
            isAuth: true,
            component: Campaigns,
            exact: true,
            title:
                this.props.getTranslation('Configuração envio de E-mail') +
                ' - ' +
                this.props.getTranslation('Campaign'),
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
        {
            path: '/email-sending-settings/:emailSendingSettingId',
            isAuth: true,
            component: Campaigns,
            exact: true,
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_DEV_ADMIN,
                },
            ]),
        },
    ];

    render() {
        return <AppRouter match={this.props.match.path} routes={this.routes} />;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const CampaignsModule = I18n(withRouter(connect(mapStateToProps, {})(CampaignsModuleClass)));
