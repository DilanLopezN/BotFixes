import { Component } from 'react';
import { Redirect, Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { BotDesignerRoute } from './interfaces/BotDesignerRoute';
import { GaPageViewTracker } from './shared-v2/ga-page-view-tracker';
import { PrivateRoute } from './shared/PrivateRoute';

interface AppRouterProps {
    routes: BotDesignerRoute[];
    match: string;
    isRoot?: boolean;
}

export class AppRouter extends Component<AppRouterProps> {
    private getRoute(route: BotDesignerRoute) {
        if (route.redirectTo) {
            return <Redirect key={route.path} to={route.redirectTo} />;
        }
        const path = this.props.match + route.path;
        if (route.isAuth) {
            return (
                <PrivateRoute
                    key={route.path}
                    path={path}
                    exact={route.exact}
                    component={route.component}
                    canAccess={route.canAccess}
                    title={route.title}
                />
            );
        }

        return <Route key={route.path} path={path} exact={route.exact} component={route.component} />;
    }

    private renderRoutes = () => {
        return this.props.routes.map((route: BotDesignerRoute) => {
            return this.getRoute(route);
        });
    };

    render() {
        if (this.props.isRoot) {
            return (
                <Router>
                    <Switch>{this.renderRoutes()}</Switch>
                    <GaPageViewTracker />
                </Router>
            );
        }
        return this.renderRoutes();
    }
}
