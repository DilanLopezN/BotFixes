import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { AppRouter } from '../../Routes';
import { withRouter, RouteComponentProps } from 'react-router';
import { connect } from 'react-redux';
import HealthPage from './pages/health';
import { IntegrationContextProvider } from './integration.context';
import { UserPermission } from '../../utils/UserPermission';
import { PermissionResources, UserRoles } from 'kissbot-core';
import I18n from '../i18n/components/i18n';

interface IntegrationsProps extends RouteComponentProps {
    getTranslation: (key: string) => string;
}

class IntegrationsClass extends Component<IntegrationsProps> {
    routes: Array<BotDesignerRoute> = [
        {
            path: '',
            isAuth: true,
            exact: true,
            component: HealthPage,
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
            path: '/:integrationId/Settings',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Settings') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/flow',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Flow') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/appointmentType',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Appointment types') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/speciality',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Specialities') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/procedure',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Procedures') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/organizationUnit',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Organization units') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/insurance',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Insurances') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/insurancePlan',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Plans') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/insuranceSubPlan',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Subplans') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/planCategory',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Categories') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/doctor',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Doctors') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/occupationArea',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Occupation area') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/organizationUnitLocation',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('Location') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/typeOfService',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title: this.props.getTranslation('typeOfService') + ' - ' + this.props.getTranslation('Integrations'),
        },
        {
            path: '/:integrationId/reason',
            isAuth: true,
            exact: true,
            component: HealthPage,
            title:
                this.props.getTranslation('Motivos não agendamento') +
                ' - ' +
                this.props.getTranslation('Integrations'),
        },
    ];

    render() {
        return (
            <IntegrationContextProvider>
                <AppRouter match={this.props.match.path} routes={this.routes} />
            </IntegrationContextProvider>
        );
    }
}

const mapStateToProps = () => ({});

export const IntegrationsModule = I18n(withRouter(connect(mapStateToProps, {})(IntegrationsClass)));
