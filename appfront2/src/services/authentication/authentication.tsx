import type { Me } from '~/interfaces/me';
import { doRequest, apiInstanceWithoutToken, apiInstance } from '../api-instance';
import { LoginDto } from './interfaces';

export const AuthRequests = {
  doLogin: (login: LoginDto): Promise<any> =>
    doRequest(apiInstanceWithoutToken.post('/users/auth', login)),

  doTokenLogin: (token: string): Promise<LoginDto> =>
    doRequest(apiInstanceWithoutToken.post('/users/auth', { token })),

  validateAuth: (): Promise<Me> => doRequest(apiInstance.get(`/users/me`)),

  loginMethod: (email: string): Promise<any> =>
    doRequest(apiInstanceWithoutToken.get(`/users/method/${email}`)),

  cognitoRegistry: (body: { email: string; password: string; newPassword?: string }): Promise<Me> =>
    doRequest(apiInstanceWithoutToken.post('/users/cognito-registry', body)),

  validateCredentials: (body: { email: string; password: string }): Promise<Me> =>
    doRequest(apiInstanceWithoutToken.post('/users/validate', body)),
};
