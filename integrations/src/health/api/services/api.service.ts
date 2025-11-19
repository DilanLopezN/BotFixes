import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../common/exceptions.service';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { IIntegration, IntegrationEnvironment } from '../../integration/interfaces/integration.interface';
import { lastValueFrom } from 'rxjs';
import { AuditDataType } from '../../audit/audit.interface';
import { AuditService } from '../../audit/services/audit.service';
import { DefaultResponse } from 'kissbot-health-core';
import { SendActiveMessageData, SendActiveTrackedMessageData } from '../interfaces/send-message.interface';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';
import { CtxMetadata } from '../../../common/interfaces/ctx-metadata';
import { castObjectIdToString } from '../../../common/helpers/cast-objectid';

@Injectable()
export class ApiService {
  private readonly logger = new Logger(Logger.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly auditService: AuditService,
  ) {}

  private debugRequest(integration: IntegrationDocument, payload: any) {
    if (!integration.debug) {
      return;
    }

    const envKey = integration.environment === IntegrationEnvironment.test ? '-TEST' : '';
    this.logger.debug(
      `${castObjectIdToString(integration._id)}:${integration.name}:BOTDESIGNER${envKey}-debug`,
      payload,
    );
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

  private handleResponseException(
    integration: IntegrationDocument,
    error: any,
    payload: any,
    from: string,
    ignoreException = false,
  ) {
    const metadata: CtxMetadata = contextService.get('req:default-headers');

    this.auditService.sendAuditEvent({
      dataType: AuditDataType.externalResponse,
      integrationId: castObjectIdToString(integration._id),
      data: {
        data: error?.response,
      },
      identifier: from,
    });

    if (error && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      Sentry.captureEvent({
        message: `${castObjectIdToString(integration._id)}:${integration.name}:BOTDESIGNER-request: ${from}`,
        user: {
          id: metadata?.memberId,
          username: metadata?.conversationId,
        },
        extra: {
          payload: JSON.stringify(payload),
          error: error?.response ?? error,
          metadata: {
            cvId: metadata?.conversationId,
            wsId: metadata?.workspaceId,
            mbId: metadata?.memberId,
          },
        },
      });
    }
  }

  public async syncAllDone(integration: IntegrationDocument): Promise<IIntegration> {
    try {
      const response = await lastValueFrom(
        this.httpService.post<IIntegration>(
          `/workspaces/${integration.workspaceId}/integrations/health/${castObjectIdToString(integration._id)}/syncAllDone`,
          undefined,
        ),
      );

      return response.data;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.API_ERROR);
    }
  }

  public async sendMessage(integration: IntegrationDocument, payload: SendActiveMessageData): Promise<OkResponse> {
    const methodName = this.sendMessage.name;
    try {
      this.debugRequest(integration, payload);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OkResponse>>('/v1/messages/sendMessage', payload),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return { ok: true };
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async sendTrackedMessage(
    integration: IntegrationDocument,
    payload: SendActiveTrackedMessageData,
  ): Promise<OkResponse> {
    const methodName = this.sendTrackedMessage.name;
    try {
      this.debugRequest(integration, payload);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OkResponse>>('/v1/schedules/sendMessage', payload),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return { ok: true };
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }
}
