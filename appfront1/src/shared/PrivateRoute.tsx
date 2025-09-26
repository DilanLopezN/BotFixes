import { Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';

const PrivateRouteComponent = (props) => {
    const isAuthenticated = !!props.loggedUser;

    const routeData = { ...props };
    const Component = routeData.component;
    const rest = { ...routeData, component: undefined };

    if (props.canAccess === false) {
        return (
            <Route
                {...rest}
                render={() => {
                    return <Redirect to='/home' />;
                }}
            />
        );
    }

    return isAuthenticated ? (
        <Route
            {...rest}
            render={(props) => {
                const { settings } = routeData;
                if (routeData.title === undefined) {
                    window.document.title = settings.layout.title || 'Botdesigner';
                } else {
                    window.document.title = settings.layout.title + ' - ' + routeData.title;
                }
                return <Component {...props} />;
            }}
        />
    ) : (
        <Route
            {...rest}
            render={(props) => {
                if (routeData.path !== '/users/login') {
                    return <Redirect to='/users/login' />;
                } else {
                    return <Component {...props} />;
                }
            }}
        />
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    loggedUser: state.loginReducer.loggedUser,
    settings: state.loginReducer.settings,
});

export const PrivateRoute = connect(mapStateToProps, {})(PrivateRouteComponent);
