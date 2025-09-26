import { Component } from 'react';
import { BotDesignerRoute } from './interfaces/BotDesignerRoute';
import { LoginModule } from './modules/login/Module';
import { WorkspaceModule } from './modules/workspace/Module';
import { DashboardModule } from './modules/dashboard/Module';
import { IntegrationsModule } from './modules/integrations/Module';
import { LoginService } from './modules/login/services/LoginService';
import { connect } from 'react-redux';
import { LoginActions } from './modules/login/redux/actions';
import { ProfileModule } from './modules/profile/Module';
import { LiveAgentModule } from './modules/liveAgent/Module';
import { OrganizationSettings, PermissionResources, Scripts, ScriptType, Styles, UserLanguage } from 'kissbot-core';
import { EntitiesModule } from './modules/entity/Module';
import { AppRouter } from './Routes';
import 'core-js';
import 'antd/dist/antd.min.css';
import '@mdi/font/css/materialdesignicons.min.css';
import GlobalStyles from './GlobalStyles';
import { SettingsModule } from './modules/settings/Module';
import { configureSentry } from './utils/Sentry';
import { timeout } from './utils/Timer';
import { CustomersModule } from './modules/customers/Module';
import moment from 'moment-timezone';
import { ReactNotifications } from 'react-notifications-component';
import { Constants } from './utils/Constants';
import NotificationPasswordExpired from './ui-kissbot-v2/common/NotificationPasswordExpired';
import { UserService } from './modules/settings/service/UserService';
import { getAuthenticatedUser } from './helpers/amplify-instance';
import { HomeModule } from './modules/home';
import { isAnySystemAdmin, isSystemAdmin } from './utils/UserPermission';
import { WorkspaceService } from './modules/workspace/services/WorkspaceService';
import { CampaignsModule } from './modules/campaigns/Module';
import { PublicModule } from './modules/publicRoutes/Module';
import { HelmetInjection } from './shared/helmet-injection';
import { LanguageContextProvider } from './modules/i18n/context';
import 'moment/locale/pt-br';
import ptBR from 'antd/lib/locale/pt_BR';
import { ConfigProvider } from 'antd';
import mixpanel from 'mixpanel-browser';
import { BeamerScript } from './shared/BeamerScript';
import ReactGA from 'react-ga4';
import { UserActivityProvider } from './contexts/user-activity-context';
import { ActivityMonitor } from './components/activity-monitor';

if (process.env.NODE_ENV === 'production') {
    try {
        mixpanel.init('a81d765d88938db01e394df16994d671', {
            persistence: 'localStorage',
        });
    } catch (error) {
        console.error(`mixpanel.init ${JSON.stringify({ error })}`);
    }
}

class AppClass extends Component<any, any> {
    initialRoutes = [
        { path: '/users', isAuth: false, component: LoginModule },
        { path: '/profile', isAuth: true, component: ProfileModule },
        { path: '/home', isAuth: true, component: HomeModule },
        { path: '/public', isAuth: false, component: PublicModule },
    ];

    initialState = () => {
        const path = window.location.pathname;
        if (path === '/public/real-time') {
            return {
                loadedSettings: true,
                routesCreated: true,
            };
        }
    };

    constructor(props: any) {
        super(props);
        this.state = {
            settings: {} as OrganizationSettings,
            loadedSettings: false,
            routesCreated: false,
            routes: [...this.initialRoutes],
            ...this.initialState(),
        };
        this.getUser();
        this.startSentry();
        if (process.env.NODE_ENV === 'production') {
            this.initializeGA4();
        }
    }

    possibleRoutes: Array<BotDesignerRoute> = [
        { path: '/dashboard', isAuth: true, component: DashboardModule },
        { path: '/integrations', isAuth: true, component: IntegrationsModule },
        { path: '/live-agent', isAuth: true, component: LiveAgentModule },
        { path: '/entities', isAuth: true, component: EntitiesModule },
        { path: '/settings', isAuth: true, component: SettingsModule },
        { path: '/customers', isAuth: true, component: CustomersModule },
        { path: '/workspace', isAuth: true, component: WorkspaceModule },
        { path: '/campaigns', isAuth: true, component: CampaignsModule },
    ];

    startSentry() {
        timeout(configureSentry, 3000);
    }

    initializeGA4() {
        ReactGA.initialize('G-W6MEK0LRE3', {
            gtagOptions: {
                send_page_view: false,
            },
        });
    }

    createRoutes = async () => {
        const { loggedUser, selectedWorkspace } = this.props;
        const { settings } = this.state;
        const workspaceId = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.CURRENT_WORKSPACE);

        let userRoles = loggedUser.roles.filter(
            (role) =>
                role.resource === PermissionResources.ANY ||
                (role.resource === PermissionResources.WORKSPACE &&
                    role.resourceId === (selectedWorkspace?._id || workspaceId))
        );

        if (!userRoles.length) {
            userRoles = loggedUser.roles;
        }
        const routes: any[] = [];

        settings?.extensions.forEach((extension) => {
            const route = [...this.possibleRoutes, ...this.state.routes].find(
                (possibleRoute: BotDesignerRoute) =>
                    possibleRoute.path.split('/')?.[1] === extension.extension &&
                    extension.enable &&
                    (isSystemAdmin(loggedUser) ||
                        extension.roles?.some(
                            (extensionRole) => userRoles.map((role) => role.role).indexOf(extensionRole) !== -1
                        ))
            );

            extension.hasPermission = !!route;
            if (!!route) {
                routes.push(route);
            }
        });
        if (!!selectedWorkspace?._id && !isAnySystemAdmin(loggedUser)) {
            const workspaceDisabled = await WorkspaceService.checkWorkspaceBlocked(selectedWorkspace._id);
            if (workspaceDisabled) {
                return this.setState({
                    routes: [
                        { path: '/users', isAuth: false, component: LoginModule },
                        {
                            path: '',
                            redirectTo: '/users/workspace-disabled',
                            isAuth: false,
                            exact: true,
                        },
                    ],
                    routesCreated: true,
                });
            }
        }

        // needs routes override
        this.setState({
            routes: [
                ...this.initialRoutes,
                ...routes,
                {
                    path: '',
                    redirectTo: '/home',
                    isAuth: false,
                    exact: true,
                },
            ],
            routesCreated: true,
        });
    };

    injectScripts = (settings: OrganizationSettings) => {
        const createScript = (data: string, type: ScriptType) => {
            const element = document.createElement('script');

            if (type === ScriptType.external) {
                element.src = data;
            } else if (type === ScriptType.inline) {
                element.innerHTML = data;
            }

            document.head.appendChild(element);
        };

        if (settings?.scripts?.length > 0) {
            console.log('script');
            settings.scripts.map(
                (script: Scripts) => script.data && script.type && createScript(script.data, script.type)
            );
        }
    };

    injectStyles = (settings: OrganizationSettings) => {
        const createStyle = (path: string) => {
            const append = document.createElement('style');
            append.setAttribute('rel', 'stylesheet');
            append.setAttribute('type', 'text/css');
            append.setAttribute('href', path);
            document.head.appendChild(append);
        };

        if (settings?.styles?.length > 0) {
            settings.styles.map((style: Styles) => createStyle(style.path));
        }
    };

    setTitle = (settings: OrganizationSettings) => {
        document.title = settings?.layout?.title || 'Botdesigner';
    };

    execSettings = async () => {
        const settings: OrganizationSettings = await LoginService.getSettings();
        this.setState({ settings });
        this.props.setSettings(settings);

        this.injectScripts(settings);
        this.injectStyles(settings);
        this.setTitle(settings);
        this.setState({ loadedSettings: true });
    };

    private getAuthenticatedUser = async () => {
        try {
            const authenticatedUser = await getAuthenticatedUser();
            if (!authenticatedUser) {
                return;
            }

            return await UserService.authenticatedByToken();
        } catch (error) {
            console.log(error);
        }
    };

    getPasswordChangedLocal = () => {
        const changed = localStorage.getItem(Constants.LOCAL_STORAGE_MAP.PASSWORD_CHANGED);
        if (typeof changed !== 'string') {
            localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.PASSWORD_CHANGED);
            return {};
        }
        const removeLocal = () => localStorage.removeItem(Constants.LOCAL_STORAGE_MAP.PASSWORD_CHANGED);

        try {
            const obj = JSON.parse(changed);
            if (obj && typeof obj === 'object' && obj !== null) {
                const parsed = JSON.parse(changed);
                return parsed;
            }
        } catch (err) {
            removeLocal();
            return {};
        }
    };

    componentDidUpdate(prevProps: any) {
        const { loggedUser, selectedWorkspace } = this.props;
        const { settings, routesCreated } = this.state;

        if (!loggedUser?._id && window.location.pathname !== '/users/login') {
            return this.setState({
                routes: [
                    ...this.initialRoutes,
                    {
                        path: '',
                        redirectTo: '/users/login',
                        isAuth: false,
                        exact: true,
                    },
                ],
            });
        }

        if (!!selectedWorkspace && !!loggedUser) {
            moment.tz.setDefault(loggedUser?.timezone || selectedWorkspace?.timezone || 'America/Sao_Paulo');
        }

        if (
            !!selectedWorkspace &&
            !!loggedUser &&
            !!prevProps.selectedWorkspace &&
            prevProps.selectedWorkspace._id !== selectedWorkspace._id
        ) {
            //caso o workspace tenha sido alterado, atualizar as rotas baseado nas permissões do usuário
            return this.createRoutes();
        }

        if (!routesCreated && !!loggedUser?._id && !!settings._id) {
            return this.createRoutes();
        } else if (!loggedUser?._id && routesCreated) {
            // reset to create new routes if loggeduser changed
            return this.setState({ routesCreated: false });
        }
    }

    setPasswordChangedLocal = (loggedUserId) => {
        const replChanged = {
            ...this.getPasswordChangedLocal(),
            [loggedUserId]: {
                changed: true,
            },
        };
        localStorage.setItem(Constants.LOCAL_STORAGE_MAP.PASSWORD_CHANGED, JSON.stringify(replChanged));
    };

    handlePasswordExpired = (user) => {
        const expirationDate = moment(user.passwordExpires);
        const hoursToExpirePassword = moment.duration(expirationDate.diff(moment())).asHours();
        const localStoragePassword = this.getPasswordChangedLocal();

        if (
            (JSON.stringify(localStoragePassword) === '{}' || localStoragePassword?.[user._id]?.changed === false) &&
            hoursToExpirePassword <= 120
        ) {
            this.setState({ showPasswordExpirationModal: true, user });
        }
    };

    async getUser() {
        try {
            const path = window.location.pathname;
            if (path === '/public/real-time') {
                return;
            }

            const user = await this.getAuthenticatedUser();
            if (!!user?.passwordExpires) {
                if (path !== '/users/password-reset') {
                    this.handlePasswordExpired(user);
                }
            }

            this.props.setUser(user);
        } catch (error) {
            console.log(error);
        }
        return this.execSettings();
    }

    closeModal = () => {
        this.setState({ showPasswordExpirationModal: false });
    };

    render() {
        const { showPasswordExpirationModal } = this.state;

        if (!this.state.loadedSettings) {
            return null;
        }

        if (this.props?.loggedUser && process.env.NODE_ENV === 'production') {
            try {
                mixpanel.identify(this.props?.loggedUser._id);
            } catch (error) {
                console.error(`mixpanel.identify ${JSON.stringify({ error })}`);
            }
        }

        return (
            <>
                {process.env.NODE_ENV === 'production' ? (
                    <>
                        <HelmetInjection
                            workspaceId={this.props.selectedWorkspace?._id}
                            loggedUser={this.props?.loggedUser}
                            cxExternalEmail={this.props?.selectedWorkspace?.customerXSettings?.email}
                            cxExternalId={this.props?.selectedWorkspace?.customerXSettings?.id}
                        />
                        <BeamerScript workspaceId={this.props.selectedWorkspace?._id} />
                    </>
                ) : null}
                <ReactNotifications />
                <ConfigProvider locale={this.props?.loggedUser?.language === UserLanguage.pt ? ptBR : undefined}>
                    <LanguageContextProvider>
                        <UserActivityProvider>
                            <AppRouter isRoot={true} routes={[...this.state.routes]} match='' />
                            <ActivityMonitor />
                        </UserActivityProvider>
                    </LanguageContextProvider>
                </ConfigProvider>
                <GlobalStyles />
                {showPasswordExpirationModal && (
                    <div className='password-expiration-modal'>
                        <NotificationPasswordExpired
                            expirationDate={this.state.user.passwordExpires}
                            setLocalStorage={this.closeModal}
                        />
                    </div>
                )}
            </>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export const App = connect(mapStateToProps, {
    setSettings: LoginActions.setSettings,
    setUser: LoginActions.setUser,
})(AppClass);
