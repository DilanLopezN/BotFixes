import { User } from 'kissbot-core';
import { FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getAuthenticatedUser } from '../../../../helpers/amplify-instance';
import { redirectAfterLoginPath } from '../../../../utils/UserPermission';
import { UserService } from '../../../settings/service/UserService';
import { LoginActions } from '../../redux/actions';

const Auth: FC<any> = () => {
    const history = useHistory();
    const dispatch = useDispatch();

    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const redirect = (loggedUser: User) => {
        if (!loggedUser?._id) {
            return;
        }
        const routeToRedirect = redirectAfterLoginPath(loggedUser);
        return history.push(routeToRedirect);
    };

    useEffect(() => {
        if (!!loggedUser) {
            redirect(loggedUser);
        }
    }, [loggedUser]);

    useEffect(() => {
        getUserIsAuthenticated();
    }, []);

    const getUserIsAuthenticated = async () => {
        const authenticatedUser = await getAuthenticatedUser();

        if (!!authenticatedUser) {
            const user = await UserService.authenticatedByToken();
            return dispatch(LoginActions.login(user) as any);
        }

        history.push('/users/login');
    };

    return <div>Authenticating..</div>;
};

export default Auth;
