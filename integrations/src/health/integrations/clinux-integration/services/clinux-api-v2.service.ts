import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import {
  ClinuxProcedureGuidanceParamsRequest,
  ClinuxProcedureGuidanceResponse,
} from '../interfaces/base-register.interface';
import * as contextService from 'request-context';
import {
  ClinuxCancelScheduleParamsRequest,
  ClinuxCancelScheduleResponse,
  ClinuxConfirmScheduleParamsRequest,
  ClinuxConfirmScheduleResponse,
} from '../interfaces/schedule.interface';
import { AuthResponse } from '../interfaces/auth.interface';
import { CacheService } from '../../../../core/cache/cache.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { ClinuxCredentialsResponse } from '../interfaces/credentials';
import { ClinuxListSchedulesParamsRequest, ClinuxSchedule } from '../interfaces/appointment.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class ClinuxApiV2Service {
  private readonly logger = new Logger(ClinuxApiV2Service.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.CLINUX).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  private debugRequest(integration: IntegrationDocument, payload: any) {
    if (!integration.debug) {
      return;
    }

    this.logger.debug(`${integration._id}:${integration.name}:CLINUX-debug`, payload);
  }

  private handleResponseError(
    integration: IntegrationDocument,
    error: any,
    payload: any,
    from: string,
    ignoreException = false,
  ) {
    const metadata = contextService.get('req:default-headers');

    this.auditService.sendAuditEvent({
      dataType: AuditDataType.externalResponse,
      integrationId: castObjectIdToString(integration._id),
      data: {
        data: error?.response,
      },
      identifier: from,
    });

    if (error?.response?.data && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:CLINUX-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error?.response, metadata),
      });
    }
  }

  private async getApiUrl(integration: IntegrationDocument): Promise<string> {
    const { apiUrlV2 } = await this.credentialsHelper.getConfig<ClinuxCredentialsResponse>(integration);

    if (!apiUrlV2) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'invalid api url',
      });
    }

    return apiUrlV2;
  }

  private dispatchAuditEvent(integration: IntegrationDocument, data: any, identifier: string, dataType: AuditDataType) {
    this.auditService.sendAuditEvent({
      dataType,
      integrationId: castObjectIdToString(integration._id),
      data: {
        data,
      },
      identifier,
    });
  }

  private async getDefaultRequestParams(
    integration: IntegrationDocument,
    params?: any,
  ): Promise<{ [key: string]: any }> {
    const requestParams = {};
    let token = await this.getClinuxIntegrationToken(integration);

    if (!token) {
      await this.auth(integration);
    }

    token = await this.getClinuxIntegrationToken(integration);

    if (!token || typeof token !== 'string') {
      throw new Error('ClinuxApiService.getDefaultRequestParams: It was not possible to get a token');
    }

    requestParams['token'] = token;

    Object.keys(params ?? {})?.forEach((key) => {
      requestParams[key] = params[key];
    });

    return requestParams;
  }

  private async setClinuxIntegrationToken(integration: IntegrationDocument, token: string): Promise<void> {
    await this.cacheService.set(token, `CLINUXV2:TOKEN:${integration._id}`, 14_000);
  }

  private async getClinuxIntegrationToken(integration: IntegrationDocument): Promise<string | null> {
    return await this.cacheService.get(`CLINUXV2:TOKEN:${integration._id}`);
  }

  public async listSchedules(
    integration: IntegrationDocument,
    payload: ClinuxListSchedulesParamsRequest,
  ): Promise<ClinuxSchedule[]> {
    try {
      this.debugRequest(integration, payload);
      let token = await this.getClinuxIntegrationToken(integration);

      if (!token) {
        await this.auth(integration);
        token = await this.getClinuxIntegrationToken(integration);
      }

      if (!token) {
        throw new Error('ClinuxApiV2Service.listSchedules: It was not possible to get a token');
      }

      const formData = new URLSearchParams();
      Object.keys(payload || {}).forEach((key) => {
        formData.append(key, payload[key]);
      });

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxSchedule[]>(`${apiUrl}/se1/doListaConfirmacao?${formData.toString()}`, undefined, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'listSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    params: ClinuxConfirmScheduleParamsRequest,
  ): Promise<ClinuxConfirmScheduleResponse[]> {
    const methodName = 'confirmSchedule';

    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxConfirmScheduleResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doAgendaConfirmar`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    params: ClinuxCancelScheduleParamsRequest,
  ): Promise<ClinuxCancelScheduleResponse[]> {
    const methodName = 'cancelSchedule';

    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxCancelScheduleResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doAgendaCancelar`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async auth(integration: IntegrationDocument): Promise<AuthResponse[]> {
    const { apiUsername: username, apiPassword: password } =
      await this.credentialsHelper.getConfig<ClinuxCredentialsResponse>(integration);

    try {
      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.get<AuthResponse[]>(`${apiUrl}/se1/doFuncionarioLogin`, {
          params: {
            id: username,
            pw: password,
          },
        }),
      );

      await this.setClinuxIntegrationToken(integration, response.data?.[0].ds_token);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'auth');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedureGuidance(
    integration: IntegrationDocument,
    payload: ClinuxProcedureGuidanceParamsRequest,
  ): Promise<ClinuxProcedureGuidanceResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, payload);
      this.debugRequest(integration, payload);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxProcedureGuidanceResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doProcedimentoPreparo`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getProcedureGuidance');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
