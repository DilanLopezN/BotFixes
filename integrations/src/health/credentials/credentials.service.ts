import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../core/cache/cache.service';
import { IntegrationDocument } from '../../health/integration/schema/integration.schema';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import * as Sentry from '@sentry/node';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { castObjectIdToString } from '../../common/helpers/cast-objectid';
import { IntegrationType } from '../interfaces/integration-types';

const CREDENTIALS_EXPIRATION = 300;
const CREDENTIALS_EXPIRATION_LOCAL = 300;

@Injectable()
export class CredentialsHelper {
  private logger: Logger = new Logger(CredentialsHelper.name);
  public constructor(
    private readonly cacheService: CacheService,
    private readonly httpService: HttpService,
  ) {}

  private getCacheExpiration(): number {
    if (process.env.NODE_ENV === 'local') {
      return CREDENTIALS_EXPIRATION_LOCAL;
    }

    return CREDENTIALS_EXPIRATION;
  }

  public async setIntegrationCredentials(integration: IntegrationDocument, credentials: string): Promise<void> {
    await this.cacheService.set(
      credentials,
      `CREDENTIALS:${castObjectIdToString(integration._id)}`,
      this.getCacheExpiration(),
    );
  }

  public async getIntegrationCredentials(integration: IntegrationDocument): Promise<string | null> {
    return await this.cacheService.get(`CREDENTIALS:${castObjectIdToString(integration._id)}`);
  }

  public async getConfig<T>(integration: IntegrationDocument): Promise<T> {
    const { NODE_ENV, DEBUG_INTEGRATION_TOKEN, DEBUG_INTEGRATION_ID, SOCKET_API_URL, API_TOKEN } = process.env;

    if (NODE_ENV === 'local' && integration.type === IntegrationType.BOTDESIGNER) {
      return {
        apiUrl: `${SOCKET_API_URL}/v1`,
        apiToken: API_TOKEN,
      } as any;
    }

    if (NODE_ENV === 'local' && integration.type === IntegrationType.BOTDESIGNER) {
      return {
        apiUrl: 'http://bd__health-socket:3005/v1',
        apiToken: '123456',
      } as any;
    } else if (NODE_ENV === 'local') {
      const cachedCredentials = await this.getIntegrationCredentials(integration);
      if (cachedCredentials) {
        return JSON.parse(cachedCredentials);
      }

      try {
        const response = await this.getAccessTokenData<T>(DEBUG_INTEGRATION_ID, DEBUG_INTEGRATION_TOKEN);
        if (response) {
          await this.setIntegrationCredentials(integration, JSON.stringify(response));
        }
        return response;
      } catch (error) {
        this.logger.error('CredentialsHelper.getConfig: Credenciais inválidas. Gere um novo token de acesso.');
        this.logger.error(error);
        return null;
      }
    }

    const cachedCredentials = await this.getIntegrationCredentials(integration);
    if (cachedCredentials) {
      return JSON.parse(cachedCredentials);
    }

    const secretName = process.env.INTEGRATIONS_SECRET;
    const secretsManager = new SecretsManager({
      region: 'sa-east-1',
      credentials: fromNodeProviderChain({
        clientConfig: { region: 'sa-east-1' },
      }),
    });

    try {
      const data = await secretsManager.getSecretValue({ SecretId: secretName });
      if (!data.SecretString) {
        return;
      }

      const secretStringData = JSON.parse(data.SecretString);
      const credentialsString = secretStringData?.[castObjectIdToString(integration._id)];

      if (!credentialsString) {
        return null;
      }

      const credentials = JSON.parse(credentialsString);

      if (!credentials) {
        Sentry.captureEvent({
          message: `ERROR:${castObjectIdToString(integration._id)}:${integration.name}:CREDENTIALS`,
          extra: {
            integrationId: castObjectIdToString(integration._id),
            message: 'Credentials not found',
          },
        });

        return null;
      }

      await this.setIntegrationCredentials(integration, JSON.stringify(credentials));
      return credentials;
    } catch (err) {
      console.error(
        `Error on getting secret from Secret Manager: ${castObjectIdToString(integration._id)} (${integration.name})`,
        err,
      );
    }
  }

  private async getAccessTokenData<T>(integrationId: string, token: string): Promise<T> {
    const response = await lastValueFrom(
      this.httpService.post<T>(`/integration/${integrationId}/token-management/getAccessTokenData`, {
        token,
      }),
    );

    return response?.data;
  }
}
