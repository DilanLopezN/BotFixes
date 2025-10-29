import store from '../redux/store';
import { User } from 'kissbot-core';
import { LoginActions } from '../modules/login/redux/actions';

export const getLoggedUserFromStore = () => {
    const state: any = store.getState();
    const user: User = state.loginReducer.loggedUser;
    return user;
};

export const resetLoggedUserIntoStore = () => {
    return store.dispatch(LoginActions.setUser(undefined));
};
