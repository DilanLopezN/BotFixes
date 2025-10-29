import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { envConstants } from '~/constants/authentication';
import { getCognitoUserSession } from './amplify-instance';

const setInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (config) => {
      const newConfigs = config;
      const session = await getCognitoUserSession();
      const token = session.getIdToken().getJwtToken();
      const accessToken = session.getAccessToken().getJwtToken();
      if (!!token && !!config.headers) {
        newConfigs.headers.Authorization = `Bearer ${token}`;
        newConfigs.headers['Access-Token'] = `Bearer ${accessToken}`;
      }
      return newConfigs;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
  );

  return instance;
};

export const apiInstance = setInterceptors(
  axios.create({
    baseURL: envConstants.API_URL,
    timeout: 30000,
  })
);

export const apiInstanceWithoutToken = axios.create({
  baseURL: envConstants.API_URL,
  timeout: 15_000,
});

export const doRequest = async <T>(request: Promise<AxiosResponse<T>>) => {
  const req = await request;
  return req.data;
};
