import { HttpStatus, Injectable } from '@nestjs/common';
import { GenerateAccessTokenResponse } from './interfaces/generate-access-token.interface';
import * as jwt from 'jsonwebtoken';
import { CredentialsHelper } from '../credentials/credentials.service';
import { IntegrationService } from '../integration/integration.service';
import { HTTP_ERROR_THROWER } from '../../common/exceptions.service';
import { IntegrationType } from '../interfaces/integration-types';

@Injectable()
export class TokenManagementService {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {}

  public async generateAccessToken(integrationId: string): Promise<GenerateAccessTokenResponse> {
    if (process.env.NODE_ENV === 'local') {
      return { token: null };
    }

    const integration = await this.integrationService.getOne(integrationId);

    if (!integration || [IntegrationType.BOTDESIGNER, IntegrationType.CUSTOM_IMPORT].includes(integration.type)) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        'TokenManagementService.generateAccessToken: Invalid integration type',
        undefined,
        true,
      );
    }

    const config: Record<string, string> = await this.credentialsHelper.getConfig(integration);

    if (!config) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        'TokenManagementService.generateAccessToken: Invalid credentials',
        undefined,
        true,
      );
    }

    const token = jwt.sign(
      {
        integrationId,
        ...config,
      },
      process.env.INTEGRATIONS_JWT_ACCESS,
      {
        expiresIn: '12 hours',
      },
    );

    return { token };
  }

  public async getAccessTokenData(integrationId: string, token: string): Promise<Record<string, string>> {
    if (process.env.NODE_ENV === 'local') {
      return null;
    }

    const integration = await this.integrationService.getOne(integrationId);

    if (!integration) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        'TokenManagementService.generateAccessToken: Invalid integration',
        undefined,
        true,
      );
    }

    try {
      jwt.verify(token, process.env.INTEGRATIONS_JWT_ACCESS);
      const decodedToken = jwt.decode(token) as Record<string, string>;

      if (decodedToken.integrationId !== integrationId) {
        return null;
      }

      return decodedToken;
    } catch (err) {
      return null;
    }
  }
}
