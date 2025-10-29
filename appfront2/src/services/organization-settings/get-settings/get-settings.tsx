import { apiInstance, doRequest } from '~/services/api-instance';
import { OrganizationSettings } from './interfaces';

export const getSettings = (): Promise<OrganizationSettings> =>
  doRequest(apiInstance.get('/organization-settings'));
