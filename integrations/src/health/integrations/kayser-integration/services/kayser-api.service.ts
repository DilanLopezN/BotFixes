import { HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  KayserConfirmOrCancelScheduleParamsRequest,
  KayserConfirmOrCancelScheduleResponse,
  KayserListSchedulesParamsRequest,
  KayserListSchedulesResponse,
} from '../interfaces/confirmation.interface';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { AuditService } from '../../../audit/services/audit.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { OkResponse } from '../../../../common/interfaces/ok-response.interface';
import { KayserStatusResponse } from '../interfaces/base-register.interface';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { KayserCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

export enum ConfirmOrCancelApi {
  confirm = 'ConfirmarAgendamento',
  cancel = 'CancelarAgendamento',
}

@Injectable()
export class KayserApiService {
  constructor(
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly httpService: HttpService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.KAYSER).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
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

    if (error?.response?.data && !ignoreException) {
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:KAYSER-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error?.response, metadata),
      });
    }
  }

  async confirmOrCancelSchedule(
    type: ConfirmOrCancelApi,
    integration: IntegrationDocument,
    payload: KayserConfirmOrCancelScheduleParamsRequest,
  ): Promise<KayserConfirmOrCancelScheduleResponse> {
    try {
      const { apiUrl } = await this.credentialsHelper.getConfig<KayserCredentialsResponse>(integration);
      const request = await lastValueFrom(
        this.httpService.post<KayserConfirmOrCancelScheduleResponse>(
          `${apiUrl}/api/botdesigner/agendamento/${type}`,
          payload,
        ),
      );
      return request?.data || null;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, this.confirmOrCancelSchedule.name);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  async listSchedules(
    integration: IntegrationDocument,
    params: KayserListSchedulesParamsRequest,
  ): Promise<KayserListSchedulesResponse> {
    try {
      const { apiUrl } = await this.credentialsHelper.getConfig<KayserCredentialsResponse>(integration);
      const request = await lastValueFrom(
        this.httpService.get<KayserListSchedulesResponse>(`${apiUrl}/api/botdesigner/agendamento/ListarAgendamentos`, {
          params,
        }),
      );
      return request?.data || null;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, this.listSchedules.name);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  async status(integration: IntegrationDocument): Promise<OkResponse> {
    try {
      const { apiUrl } = await this.credentialsHelper.getConfig<KayserCredentialsResponse>(integration);
      const request = await lastValueFrom(
        this.httpService.get<KayserStatusResponse>(`${apiUrl}/api/botdesigner/echo/teste`),
      );
      return { ok: request?.data.success };
    } catch (error) {
      this.handleResponseError(integration, error, undefined, this.status.name);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
