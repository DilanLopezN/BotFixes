import { Action } from '../../../interfaces/ReduxAction';
import { LoginTypes } from './types';
import { User } from 'kissbot-core';

export const LoginActions = {
    login(login: User): Action {
        return {
            type: LoginTypes.LOGIN,
            payload: {
                loggedUser: login,
            },
        };
    },
    update(user): Action {
        return {
            type: LoginTypes.UPDATE,
            payload: {
                user,
            },
        };
    },
    setSettings(settings: any): Action {
        return {
            type: LoginTypes.SETTINGS,
            payload: {
                settings,
            },
        };
    },
    setUser(user: User | undefined): Action {
        return {
            type: LoginTypes.SET_USER,
            payload: {
                user,
            },
        };
    },
    setError(message: any): Action {
        return {
            type: LoginTypes.SET_ERROR,
            payload: {
                message,
            },
        };
    },
    removeError(): Action {
        return {
            type: LoginTypes.REMOVE_ERROR,
            payload: {},
        };
    },
};
