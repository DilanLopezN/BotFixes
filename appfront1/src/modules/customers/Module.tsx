import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import Customers from './page/Customers';
import { UserPermission } from '../../utils/UserPermission';
import { PermissionResources, UserRoles } from 'kissbot-core';
import I18n from '../i18n/components/i18n';

class CustomersModuleClass extends Component<any> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        {
            path: '',
            isAuth: true,
            component: Customers,
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
                    role: UserRoles.SYSTEM_UX_ADMIN,
                },
            ]),
        },
        {
            path: '/billing',
            isAuth: true,
            component: Customers,
            exact: true,
            title: this.props.getTranslation('Billing') + ' - ' + this.props.getTranslation('Customers'),
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
            ]),
        },
        {
            path: '/accounts',
            isAuth: true,
            component: Customers,
            exact: true,
            title: this.props.getTranslation('Accounts') + ' - ' + this.props.getTranslation('Customers'),
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
            ]),
        },
        {
            path: '/setup',
            isAuth: true,
            component: Customers,
            exact: true,
            title: this.props.getTranslation('Setup') + ' - ' + this.props.getTranslation('Customers'),
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
            ]),
        },
        {
            path: '/workspaceId/:workspaceId/accountId/:accountId',
            isAuth: true,
            component: Customers,
            exact: true,
            canAccess: UserPermission.can([
                {
                    resource: PermissionResources.ANY,
                    role: UserRoles.SYSTEM_ADMIN,
                },
            ]),
        },
        // { path: '/:path', isAuth: true, component: Customers, exact: true },
    ];

    render() {
        return <AppRouter match={this.props.match.path} routes={this.routes} />;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const CustomersModule = I18n(withRouter(connect(mapStateToProps, {})(CustomersModuleClass)));
