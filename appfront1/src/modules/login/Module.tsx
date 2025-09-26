import { Component } from 'react';
import { BotDesignerRoute } from '../../interfaces/BotDesignerRoute';
import { withRouter } from 'react-router';
import Login from './pages/login';
import { BotDesignerModule } from '../../interfaces/BotDesignerModule';
import { AppRouter } from '../../Routes';
import ResetPassword from './pages/reset-password';
import { connect } from 'react-redux';
import { isSSOUser } from '../../helpers/user';
import Auth from './pages/auth';
import WorkspaceDisabled from './pages/workspaceDisabled';

import PasswordReset from './pages/recover';

class LoginModuleClass extends Component<any, { routes: BotDesignerRoute[] }> implements BotDesignerModule {
    routes: Array<BotDesignerRoute> = [
        { path: '/login', isAuth: false, component: Login },
        { path: '/auth', isAuth: false, component: Auth },
        { path: '/workspace-disabled', isAuth: false, component: WorkspaceDisabled },
        { path: '/recover-password', isAuth: false, component: PasswordReset },
    ];

    constructor(props) {
        super(props);
        this.state = {
            routes: this.routes,
        };
    }

    componentDidMount() {
        if (!isSSOUser(this.props.loggedUser)) {
            this.setState({
                routes: [...this.routes, { path: '/password-reset', isAuth: true, component: ResetPassword }],
            });
        }
    }

    render() {
        return <AppRouter match={this.props.match.path} routes={this.state.routes} />;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
});

export const LoginModule = withRouter(connect(mapStateToProps, {})(LoginModuleClass));
