import { LoginTypes } from './types';
import { Action } from '../../../interfaces/ReduxAction';
import { ReduxInterface } from './redux-interface';

const initialState: ReduxInterface = {
    loggedUser: undefined,
    settings: {},
    errorMessages: [],
};

export const loginReducer = (state = initialState, action: Action) => {
    switch (action.type) {
        case LoginTypes.LOGIN: {
            return {
                ...state,
                loggedUser: action.payload.loggedUser,
            };
        }
        case LoginTypes.SETTINGS: {
            return {
                ...state,
                settings: action.payload.settings,
            };
        }
        case LoginTypes.UPDATE: {
            return {
                ...state,
                loggedUser: action.payload.user,
            };
        }
        case LoginTypes.SET_USER: {
            return {
                ...state,
                loggedUser: action.payload?.user || undefined,
            };
        }
        case LoginTypes.SET_ERROR: {
            return {
                ...state,
                errorMessages: [...state.errorMessages, action.payload.message],
            };
        }
        case LoginTypes.REMOVE_ERROR: {
            return {
                ...state,
                errorMessages: [],
            };
        }
        default:
            return state;
    }
};
