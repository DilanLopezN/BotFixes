import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lastValueFrom } from 'rxjs';
import { Readable } from 'stream';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { CacheService } from '../../../../core/cache/cache.service';
import {
  ShiftTokenResponse,
  ShiftConsultaLaudosResponse,
  ShiftCredentials,
  ShiftErrorResponse,
} from '../interfaces/shift-api.interface';
import { IntegrationService } from '../../../integration/integration.service';
import { IntegrationType } from '../../../interfaces/integration-types';
import { shouldRunCron } from '../../../../common/bootstrap-options';
import * as moment from 'moment';

interface TokenCache {
  token: string;
  expiresAt: string;
}

@Injectable()
export class ShiftApiService {
  private readonly logger = new Logger(ShiftApiService.name);
  private readonly TOKEN_TTL_SECONDS = 5 * 60; // Token válido por 30 minutos (1800 segundos)
  private readonly CACHE_KEY_PREFIX = 'shift:token';

  constructor(
    private readonly httpService: HttpService,
    private readonly credentialsHelper: CredentialsHelper,
    private readonly cacheService: CacheService,
    private readonly integrationService: IntegrationService,
  ) {}

  /**
   * Recupera as credenciais do Shift da integração
   */
  private async getCredentials(integration: IntegrationDocument): Promise<ShiftCredentials> {
    const credentials = await this.credentialsHelper.getConfig<ShiftCredentials>(integration);

    if (!credentials?.usuario || !credentials?.senha || !credentials?.baseUrl) {
      throw new Error('Shift credentials not configured properly');
    }

    return credentials;
  }

  /**
   * Gera um novo token na API do Shift e salva no cache do Redis
   * Usado pelo cron para alimentar o cache periodicamente
   */
  async generateAndCacheToken(integration: IntegrationDocument): Promise<string> {
    const integrationId = integration._id.toString();
    const cacheKey = `${this.CACHE_KEY_PREFIX}:${integrationId}`;
    const credentials = await this.getCredentials(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.post<ShiftTokenResponse>(
          `${credentials.baseUrl}/RecuperaToken`,
          {
            usuario: credentials.usuario,
            senha: credentials.senha,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.data.sucesso !== 'true' || !response.data.token) {
        throw new Error('Failed to get token from Shift API');
      }

      // Armazena no cache do Redis com TTL
      const expiresAt = moment().add(this.TOKEN_TTL_SECONDS, 'seconds').toISOString();
      const tokenData: TokenCache = {
        token: response.data.token,
        expiresAt,
      };

      await this.cacheService.set(tokenData, cacheKey, this.TOKEN_TTL_SECONDS);

      return response.data.token;
    } catch (error) {
      this.logger.error(`Error generating token from Shift API: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtém o token do cache do Redis (somente leitura)
   * Usado pelas chamadas de API para evitar conflitos com o cron
   * Se o token não existir no cache, lança erro
   */
  async getTokenFromCache(integration: IntegrationDocument): Promise<string> {
    const integrationId = integration._id.toString();
    const cacheKey = `${this.CACHE_KEY_PREFIX}:${integrationId}`;

    // Verifica se existe token em cache válido
    const cachedToken = await this.cacheService.get(cacheKey);
    if (cachedToken) {
      const tokenCache: TokenCache = cachedToken;
      if (tokenCache.expiresAt && moment(tokenCache.expiresAt).isAfter(moment())) {
        return tokenCache.token;
      }
    }

    // Token não encontrado ou expirado
    throw new Error(
      `Shift API token not found or expired in cache for integration ${integrationId}. ` +
        'The token refresh cron may not be running or the integration may be new.',
    );
  }

  /**
   * Consulta os laudos disponíveis para um paciente
   */
  async consultaLaudos(
    integration: IntegrationDocument,
    cpf: string,
    dataNascimento: string,
  ): Promise<ShiftConsultaLaudosResponse> {
    const token = await this.getTokenFromCache(integration);
    const credentials = await this.getCredentials(integration);
    try {
      // Formata a data de nascimento (deve estar no formato DD/MM/YYYY)
      const dataNascimentoFormatted = encodeURIComponent(dataNascimento);
      const url = `${credentials.baseUrl}/ConsultaLaudos/${token}?cpf=${cpf}&dataNascimento=${dataNascimentoFormatted}`;
      const response = await lastValueFrom(this.httpService.get<ShiftConsultaLaudosResponse | ShiftErrorResponse>(url));

      // Verifica se a resposta contém errorMessage (erro da API com status 200)
      if ('errorMessage' in response.data && response.data.errorMessage) {
        this.logger.error(`Shift API returned error: ${response.data.errorMessage}`);
        throw new BadRequestException(response.data.errorMessage);
      }

      return response.data as ShiftConsultaLaudosResponse;
    } catch (error) {
      // Verifica se é erro 400 do axios com DescricaoErro (erro da API Shift)
      if (error.response?.status === 400 && error.response?.data?.DescricaoErro) {
        this.logger.error(`Shift API returned error 400: ${error.response.data.DescricaoErro}`);
        throw new BadRequestException(error.response.data.DescricaoErro);
      }

      this.logger.error(`Error consulting laudos: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Faz o download do PDF de um laudo usando streaming
   */
  async downloadPdf(url: string): Promise<Readable> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          responseType: 'stream',
        }),
      );

      const stream = response.data as Readable;

      stream.on('error', (error) => {
        this.logger.error('Stream error in downloadPdf:', error);
      });

      return stream;
    } catch (error) {
      this.logger.error(`Error downloading PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cron que renova os tokens de todas as integrações Shift ativas a cada 5 minutos
   * Isso garante que apenas um pod (o de cron) gere tokens, evitando conflitos no Redis
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async refreshTokensCron() {
    if (!shouldRunCron() || process.env.NODE_ENV === 'local') {
      return;
    }
    await this.refreshAllTokens();
  }

  /**
   * Renova os tokens de todas as integrações Shift ativas
   */
  async refreshAllTokens(): Promise<void> {
    try {
      // Busca todas as integrações do tipo SHIFT que estão ativas
      const integrations = await this.integrationService.list({
        type: IntegrationType.SHIFT,
        enabled: true,
      });
      // Renova o token de cada integração
      for (const integration of integrations) {
        try {
          await this.generateAndCacheToken(integration);
        } catch (error) {
          this.logger.error(`Error refreshing token for integration ${integration._id}: ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`Error in refreshAllTokens: ${error.message}`, error.stack);
    }
  }

  /**
   * Limpa o cache de token de uma integração do Redis
   */
  async clearTokenCache(integrationId: string): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:${integrationId}`;
    await this.cacheService.remove(cacheKey);
  }
}
