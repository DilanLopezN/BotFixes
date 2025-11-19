import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { ExternalDataService } from './external-data.service';
import { CredentialsHelper } from '../../credentials/credentials.service';
import { IntegrationCredentials } from '../interfaces/credentials.interface';
import { HTTP_ERROR_THROWER } from 'common/exceptions.service';
@Injectable()
export class IntegrationPrivateService {
  constructor(
    private readonly externalDataService: ExternalDataService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {}

  async getIntegrationAndValidationActive(integrationId: string) {
    const integration = await this.externalDataService.getIntegrationById(integrationId);

    if (!integration) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'error integration not found', undefined, true);
    }
    if (!integration.enabled) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'error disabled integration', undefined, true);
    }

    return integration;
  }

  async getContainerLogs(integrationId: string, runnerId: number, env: string, logSize: number): Promise<any> {
    const integration = await this.getIntegrationAndValidationActive(integrationId);
    const { apiUrl, apiToken } = await this.credentialsHelper.getConfig<IntegrationCredentials>(integration);

    const response = await axios.post(
      `${apiUrl}/runner/${runnerId}/getContainerLogs`,
      {
        env,
        logSize,
      },
      {
        headers: {
          Authorization: apiToken,
        },
        timeout: 60_000,
      },
    );

    return response?.data;
  }

  async doSql(integrationId: string, sql: string): Promise<any> {
    const integration = await this.getIntegrationAndValidationActive(integrationId);
    const { apiUrl, apiToken } = await this.credentialsHelper.getConfig<IntegrationCredentials>(integration);

    const response = await axios.post(
      `${apiUrl}/integrator/${integrationId}/doSql`,
      {
        sql,
      },
      {
        headers: {
          Authorization: apiToken,
        },
        timeout: 60_000,
      },
    );

    return response?.data;
  }

  async doDeploy(integrationId: string, runnerId: number, env: string, tag: string): Promise<any> {
    const integration = await this.getIntegrationAndValidationActive(integrationId);
    const { apiUrl, apiToken } = await this.credentialsHelper.getConfig<IntegrationCredentials>(integration);

    const response = await axios.post(
      `${apiUrl}/runner/${runnerId}/doDeploy`,
      {
        env,
        tag,
      },
      {
        headers: {
          Authorization: apiToken,
        },
        timeout: 90_000,
      },
    );

    return response;
  }

  async integratorPing(integrationId: string): Promise<any> {
    const integration = await this.getIntegrationAndValidationActive(integrationId);
    const { apiUrl, apiToken } = await this.credentialsHelper.getConfig<IntegrationCredentials>(integration);

    if (apiUrl) {
      try {
        const response = await axios.post(`${apiUrl}/integrator/${integrationId}/ping`, null, {
          headers: {
            Authorization: apiToken,
          },
          timeout: 30_000,
        });
        return response?.data?.data;
      } catch (e) {
        return {
          ok: false,
          version: null,
        };
      }
    }
  }

  async runnerPing(integrationId: string, runnerId: string): Promise<any> {
    const integration = await this.getIntegrationAndValidationActive(integrationId);
    const { apiUrl, apiToken } = await this.credentialsHelper.getConfig<IntegrationCredentials>(integration);

    if (apiUrl) {
      try {
        const response = await axios.post(`${apiUrl}/runner/${runnerId}/ping`, null, {
          headers: {
            Authorization: apiToken,
          },
          timeout: 30_000,
        });
        return response?.data;
      } catch (e) {
        return {
          ok: false,
          data: null,
        };
      }
    }
  }
}
