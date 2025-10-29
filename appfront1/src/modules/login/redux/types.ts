import { ReduxType } from '../../../interfaces/ReduxTypes';

class LoginTypesClass implements ReduxType {
    prefix = 'LOGIN__';
    LOGIN = this.prefix + 'LOGIN';
    SETTINGS = this.prefix + 'SETTINGS';
    UPDATE = this.prefix + 'UPDATE';
    SET_USER = this.prefix + 'SET_USER';
    SET_ERROR = this.prefix + 'SET_ERROR';
    REMOVE_ERROR = this.prefix + 'REMOVE_ERROR';
}
export const LoginTypes = new LoginTypesClass();
