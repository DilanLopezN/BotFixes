import { LoginDto, LoginMethod } from '../interfaces/login';
import { doRequest, apiInstanceWithoutToken } from '../../../utils/Http';
import { User } from 'kissbot-core';

export const LoginService = {
    doLogin: (login: LoginDto): Promise<any> => {
        return doRequest(apiInstanceWithoutToken.post('/users/auth', login), false, (responseError) => responseError);
    },
    doTokenLogin: (token: string): Promise<LoginDto> => {
        return doRequest(apiInstanceWithoutToken.post('/users/auth', { token }));
    },
    getSettings: (): Promise<any> => {
        return doRequest(apiInstanceWithoutToken.get('/organization-settings'));
    },
    loginMethod: (email: string, errCb: any): Promise<{ loginMethod: LoginMethod }> => {
        return doRequest(apiInstanceWithoutToken.get(`/users/method/${email}`), false, errCb);
    },
    cognitoRegistry: (body: { email: string; password: string; newPassword?: string }, errCb?: any): Promise<User> => {
        return doRequest(apiInstanceWithoutToken.post('/users/cognito-registry', body), false, errCb);
    },
    validateCredentials: (body: { email: string; password: string }, errCb?: any): Promise<User> => {
        return doRequest(apiInstanceWithoutToken.post('/users/validate', body), false, errCb);
    },
};
