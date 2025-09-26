import { LoginTypes } from './../modules/login/redux/types';
import { AxiosInstance, AxiosResponse } from 'axios';
import { Constants } from './Constants';
import store from '../redux/store';
import { getCognitoUserSession } from '../helpers/amplify-instance';
import axios from 'axios';
import { resetLoggedUserIntoStore } from './get-user-from-store';
import { dispatchSentryError } from './Sentry';

const setInterceptors = (instance: AxiosInstance) => {
    instance.interceptors.request.use(
        async (config) => {
            const session = await getCognitoUserSession();
            const token = session.getIdToken().getJwtToken();
            const accessToken = session.getAccessToken().getJwtToken();

            if (!!token && config.headers) {
                config.headers['Authorization'] = `Bearer ${token}`;
                // @TODO: enviar em rotas do usuario
                config.headers['Access-Token'] = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => {
            Promise.reject(error);
        }
    );

    return instance;
};

const apiInstance = setInterceptors(
    axios.create({
        baseURL: Constants.API_URL,
        timeout: 15_000,
    })
);

const integrationsApiInstance = setInterceptors(
    axios.create({
        baseURL: Constants.INTEGRATIONS_API_URL,
        timeout: 15_000,
    })
);

const apiInstanceWithoutToken = axios.create({
    baseURL: Constants.API_URL,
    timeout: 15_000,
});

const httpTransformResponse = async (
    request: Promise<AxiosResponse>,
    showErrorMessage: boolean = false,
    errCb?: (e: any) => any
) => {
    try {
        const response = await request;
        return response.data;
    } catch (e) {
        if (!!showErrorMessage) {
            store.dispatch({
                type: LoginTypes.SET_ERROR,
                payload: {
                    message: {
                        type: 'warning',
                        text: 'Ocorreu um erro ao carregar os dados. Tente novamente.',
                        duration: 4000,
                        title: 'Algo deu errado.',
                    },
                },
            });
        }

        if (e.response?.status === 401 && e.response.data?.error === 'INVALID_TOKEN') {
            if (window.location.pathname !== '/users/login') {
                try {
                    const session = await getCognitoUserSession();
                    const token = session.getIdToken().getJwtToken();
                    const accessToken = session.getAccessToken().getJwtToken();
                    console.log('login redirect error 401: ', {session, token, accessToken, request})
                    dispatchSentryError({message: 'login redirect error 401: ', session, token, accessToken, request});
                } catch (error) {
                    console.log('error redirect login: ', error);
                }

                resetLoggedUserIntoStore();
                return (window.location.pathname = '/users/login');
            }
            return resetLoggedUserIntoStore();
        }
        if (
            e.response?.status === 403 &&
            e.response.data?.error === 'PASSWORD_EXPIRED' &&
            window.location.pathname !== '/users/password-reset'
        ) {
            window.location.href = '/users/password-reset?from=expired';
        }

        if (!!errCb) {
            if (!!e.response) {
                return errCb(e.response.data);
            }
            return errCb(e);
        }
    }
};

const doRequest = httpTransformResponse;

export { apiInstanceWithoutToken, apiInstance, integrationsApiInstance, doRequest };
