import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { lastValueFrom } from 'rxjs';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { cleanseObject } from '../../../../common/helpers/cleanse-object';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { AuditDataType } from '../../../audit/audit.interface';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { AppointmentResponse } from '../../../integrations/doctoralia-integration/interfaces/appointment.interface';
import { EntityType } from '../../../interfaces/entity.interface';
import { IntegrationType } from '../../../interfaces/integration-types';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import {
  AppointmentConfirmationRequestParams,
  AppointmentValueRequest,
  AppointmentValueResponse,
  CMResponseArray,
  CMResponsePlain,
  CancelAppointmentRequest,
  CancelAppointmentResponse,
  ConfirmAppointmentResponse,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  CreatePatientRequest,
  CreatePatientResponse,
  FollowUpAppointmentsRequestParams,
  FollowUpAppointmentsResponse,
  GetPatientResponse,
  PatientScheduleRequestParams,
  PatientScheduleResponse,
  SimplifiedListScheduleRequest,
  SimplifiedListScheduleResponse,
  UpdatePatientRequest,
  UpdatePatientResponse,
} from '../interfaces';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { CMCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class CmApiService {
  private readonly logger = new Logger(CmApiService.name);

  public constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.CM).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  private async getToken(integration: IntegrationDocument): Promise<string> {
    const { apiToken } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);

    if (!apiToken) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'Invalid api token',
      });
    }

    return apiToken;
  }

  private getUrl(integration: IntegrationDocument): string {
    switch (integration.environment) {
      case IntegrationEnvironment.test:
        return 'https://api-testing.nuria.com.br/v1';

      default: {
        return 'https://api.nuria.com.br/v1';
      }
    }
  }

  private async getDefaultHeaders(integration: IntegrationDocument) {
    const token = await this.getToken(integration);

    return {
      CMAuthToken: token,
    };
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

  private handleResponseError(
    integration: IntegrationDocument,
    response: any,
    payload: any,
    from: string,
    customError?: (err: any) => boolean,
    ignoreException?: boolean,
  ) {
    const envKey = integration.environment === IntegrationEnvironment.test ? '-TEST' : '';
    const metadata = contextService.get('req:default-headers');

    if (!!response?.data?.error || !!response?.data?.[0]?.error) {
      if (!ignoreException && integration.environment !== IntegrationEnvironment.test) {
        Sentry.captureEvent({
          message: `${integration._id}:${integration.name}:CM${envKey}-request: ${from}`,
          ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, response, metadata),
        });
      }

      if (!!customError) {
        const continueHandler = customError(response?.data?.error || response?.data?.[0]?.error);
        if (!continueHandler) {
          return;
        }
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        response?.data?.error || response?.data?.[0]?.error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    return false;
  }

  private handleResponseException(
    integration: IntegrationDocument,
    error: any,
    payload: any,
    from: string,
    ignoreException = false,
  ) {
    const metadata = contextService.get('req:default-headers');
    const envKey = integration.environment === IntegrationEnvironment.test ? '-TEST' : '';

    if (error && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:CM${envKey}-request: ${from}`,
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

  private debugRequest(integration: IntegrationDocument, payload: any) {
    if (!integration.debug) {
      return;
    }

    const envKey = integration.environment === IntegrationEnvironment.test ? '-TEST' : '';
    this.logger.debug(`${integration._id}:${integration.name}:CM${envKey}-debug`, payload);
  }

  public async getPatientByCode(
    integration: IntegrationDocument,
    code: string,
    isRetry?: boolean,
  ): Promise<CMResponsePlain<GetPatientResponse>> {
    const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
    const route = 'pacientes/ObterPaciente';
    const headers = await this.getDefaultHeaders(integration);
    const params = {
      codigoPaciente: code,
      codigosClientes: codeIntegration,
    };
    const methodName = 'getPatientByCode';

    try {
      const apiUrl = this.getUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<CMResponsePlain<GetPatientResponse>>(`${apiUrl}/${route}`, undefined, {
          headers,
          params,
        }),
      );

      if (!this.handleResponseError(integration, response, code, methodName)) {
        return response.data?.[0];
      }
    } catch (error) {
      this.handleResponseException(integration, error, code, 'getPatientByCode');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getPatientByCpf(
    integration: IntegrationDocument,
    cpf: string,
    isRetry?: boolean,
  ): Promise<CMResponsePlain<GetPatientResponse>> {
    try {
      const { codeIntegration } = await this.credentialsHelper.getConfig<CMCredentialsResponse>(integration);
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, { cpf });

      const response = await lastValueFrom(
        this.httpService.post<CMResponsePlain<GetPatientResponse>>(
          `${apiUrl}/pacientes/ObterPacientePorCpf`,
          undefined,
          {
            headers: {
              ...(await this.getDefaultHeaders(integration)),
            },
            params: {
              cpf,
              codigosClientes: codeIntegration,
            },
          },
        ),
      );

      if (!this.handleResponseError(integration, response, cpf, 'getPatientByCpf')) {
        return response.data?.[0];
      }
    } catch (error) {
      this.handleResponseException(integration, error, cpf, 'getPatientByCpf');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: CreatePatientRequest,
    isRetry?: boolean,
  ): Promise<CMResponsePlain<CreatePatientResponse>> {
    const methodName = 'createPatient';
    const route = 'pacientes/AdicionarPaciente';
    const headers = await this.getDefaultHeaders(integration);

    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, payload);

      const response = await lastValueFrom(
        this.httpService.post<CMResponsePlain<CreatePatientResponse>>(`${apiUrl}/${route}`, payload, {
          headers,
        }),
      );

      if (!this.handleResponseError(integration, response, payload, methodName)) {
        return response.data?.[0];
      }
    } catch (error) {
      this.dispatchAuditEvent(integration, formatException(error), methodName, AuditDataType.externalResponseError);
      this.handleResponseException(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    payload: UpdatePatientRequest,
    isRetry?: boolean,
  ): Promise<CMResponsePlain<UpdatePatientResponse>> {
    const methodName = 'updatePatient';
    const route = 'pacientes/AtualizarPaciente';
    const headers = await this.getDefaultHeaders(integration);

    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, payload);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<CMResponsePlain<UpdatePatientResponse>>(`${apiUrl}/${route}`, payload, {
          headers,
        }),
      );

      if (!this.handleResponseError(integration, response, payload, 'updatePatient')) {
        this.dispatchAuditEvent(integration, response?.data?.[0], methodName, AuditDataType.externalResponse);
        return response.data?.[0];
      }
    } catch (error) {
      this.dispatchAuditEvent(integration, formatException(error), methodName, AuditDataType.externalResponseError);
      this.handleResponseException(integration, error, payload, 'updatePatient');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async resourceListRequest<T>(
    integration: IntegrationDocument,
    payload: any,
    entityType: EntityType,
    ignoreException?: boolean,
  ): Promise<CMResponseArray<T>> {
    const resolver = () => {
      switch (entityType) {
        case EntityType.organizationUnit:
          return 'cadastrobases/ListarUnidade';

        case EntityType.procedure:
          return 'cadastrobases/ListarProcedimento';

        case EntityType.speciality:
          return 'cadastrobases/ListarEspecialidade';

        case EntityType.doctor:
          return 'cadastrobases/ListarMedico';

        case EntityType.insurance:
          return 'cadastrobases/ListarConvenio';

        case EntityType.insurancePlan:
          return 'cadastrobases/ListarPlano';

        case EntityType.planCategory:
          return 'cadastrobases/ListarCategoria';

        case EntityType.insuranceSubPlan:
          return 'cadastrobases/ListarSubplano';

        default:
          break;
      }
    };

    return await this.doResourceListRequest<T>(
      integration,
      payload,
      entityType,
      resolver(),
      undefined,
      ignoreException,
    );
  }

  private async doResourceListRequest<T>(
    integration: IntegrationDocument,
    payload: any,
    entityType: EntityType,
    target: string,
    isRetry?: boolean,
    ignoreException?: boolean,
  ): Promise<CMResponseArray<T>> {
    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, payload);

      const response = await lastValueFrom(
        this.httpService.post<CMResponseArray<any>>(`${apiUrl}/${target}`, payload, {
          headers: {
            ...(await this.getDefaultHeaders(integration)),
          },
        }),
      );

      if (
        !this.handleResponseError(integration, response, payload, 'doResourceListRequest', undefined, ignoreException)
      ) {
        return response.data?.[0];
      }
    } catch (error) {
      this.handleResponseException(integration, error, payload, 'doResourceListRequest', ignoreException);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getAppointments(
    integration: IntegrationDocument,
    payload: SimplifiedListScheduleRequest,
    isRetry?: boolean,
  ): Promise<CMResponsePlain<SimplifiedListScheduleResponse>> {
    const methodName = 'listAvailableSchedules';
    const route = 'agendamentoonlines/ListarHorariosSimplificado';
    const headers = await this.getDefaultHeaders(integration);

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, payload);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<CMResponsePlain<SimplifiedListScheduleResponse>>(`${apiUrl}/${route}`, payload, {
          headers,
        }),
      );

      if (!this.handleResponseError(integration, response, payload, methodName)) {
        this.dispatchAuditEvent(integration, response.data?.[0], methodName, AuditDataType.externalResponse);
        return response.data?.[0];
      }
    } catch (error) {
      this.dispatchAuditEvent(integration, formatException(error), methodName, AuditDataType.externalResponseError);
      this.handleResponseException(integration, error, payload, 'getAppointments');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async createAppointment(
    integration: IntegrationDocument,
    payload: CreateAppointmentRequest,
    isRetry?: boolean,
  ): Promise<CMResponsePlain<CreateAppointmentResponse>> {
    const methodName = 'createAppointment';
    const route = 'agendamentoonlines/AdicionarAgendamento';
    const headers = await this.getDefaultHeaders(integration);

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, payload);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<CMResponsePlain<CreateAppointmentResponse>>(`${apiUrl}/${route}`, payload, {
          headers,
        }),
      );

      if (
        !this.handleResponseError(integration, response, payload, 'createAppointment', (err) => {
          if (err?.extra?.includes?.('agendado') || err?.extra?.includes?.('ocupado')) {
            throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
          }

          return true;
        })
      ) {
        this.dispatchAuditEvent(integration, response.data?.[0], methodName, AuditDataType.externalResponse);
        return response.data?.[0];
      }
    } catch (error) {
      this.dispatchAuditEvent(integration, formatException(error), methodName, AuditDataType.externalResponseError);
      this.handleResponseException(integration, error, payload, 'createAppointment');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR, false, payload);
    }
  }

  public async cancelAppointment(
    integration: IntegrationDocument,
    payload: CancelAppointmentRequest,
    isRetry?: boolean,
  ): Promise<CMResponsePlain<CancelAppointmentResponse[]>> {
    const methodName = 'cancelAppointment';

    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, payload);

      const response = await lastValueFrom(
        this.httpService.post<CMResponsePlain<CancelAppointmentResponse[]>>(
          `${apiUrl}/agendamentoonlines/CancelarAgendamento`,
          payload,
          {
            headers: {
              ...(await this.getDefaultHeaders(integration)),
            },
          },
        ),
      );

      if (!this.handleResponseError(integration, response, payload, methodName)) {
        this.dispatchAuditEvent(integration, response.data, methodName, AuditDataType.externalResponse);
        return response.data;
      }
    } catch (error) {
      this.dispatchAuditEvent(integration, formatException(error), methodName, AuditDataType.externalResponseError);
      this.handleResponseException(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getPatientAppointments(
    integration: IntegrationDocument,
    params: PatientScheduleRequestParams,
    isRetry?: boolean,
  ): Promise<CMResponseArray<PatientScheduleResponse>> {
    const methodName = 'getPatientAppointments';
    const route = 'agendamentoonlines/ListarAgendamentosPaciente';
    const headers = await this.getDefaultHeaders(integration);

    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, params);

      const response = await lastValueFrom(
        this.httpService.post<CMResponseArray<PatientScheduleResponse>>(`${apiUrl}/${route}`, undefined, {
          headers,
          params,
        }),
      );

      if (!this.handleResponseError(integration, response, params, 'getPatientAppointments')) {
        return response.data?.[0];
      }
    } catch (error) {
      this.dispatchAuditEvent(integration, formatException(error), methodName, AuditDataType.externalResponseError);
      this.handleResponseException(integration, error, params, 'getPatientAppointments');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getAppointmentValue(
    integration: IntegrationDocument,
    payload: AppointmentValueRequest,
    isRetry?: boolean,
  ): Promise<CMResponsePlain<AppointmentValueResponse>> {
    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, payload);

      const response = await lastValueFrom(
        this.httpService.post<CMResponsePlain<AppointmentResponse>>(
          `${apiUrl}/agendamentoonlines/ObterValorProcedimento`,
          payload,
          {
            headers: {
              ...(await this.getDefaultHeaders(integration)),
            },
          },
        ),
      );

      if (!this.handleResponseError(integration, response, payload, 'getAppointmentValue')) {
        return response.data?.[0];
      }
    } catch (error) {
      this.handleResponseException(integration, error, payload, 'getAppointmentValue');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async confirmAppointment(
    integration: IntegrationDocument,
    params: AppointmentConfirmationRequestParams,
    isRetry?: boolean,
  ): Promise<CMResponseArray<ConfirmAppointmentResponse>> {
    const methodName = 'confirmAppointment';

    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, params);

      const response = await lastValueFrom(
        this.httpService.post<CMResponseArray<ConfirmAppointmentResponse>>(
          `${apiUrl}/confirmas/ConfirmarAgendamento`,
          undefined,
          {
            headers: {
              ...(await this.getDefaultHeaders(integration)),
            },
            params,
          },
        ),
      );

      if (
        !this.handleResponseError(integration, response, params, methodName, (err) => {
          if (err?.extra?.includes?.('A confirmação já foi feita')) {
            throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Already confirmed', HttpErrorOrigin.INTEGRATION_ERROR);
          }

          return true;
        })
      ) {
        this.dispatchAuditEvent(integration, response.data?.[0], methodName, AuditDataType.externalResponse);
        return response.data?.[0];
      }
    } catch (error) {
      this.dispatchAuditEvent(integration, formatException(error), methodName, AuditDataType.externalResponseError);
      this.handleResponseException(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getFollowUpPatientAppointments(
    integration: IntegrationDocument,
    data: FollowUpAppointmentsRequestParams,
    isRetry?: boolean,
    ignoreException = false,
  ): Promise<CMResponseArray<FollowUpAppointmentsResponse>> {
    try {
      const apiUrl = this.getUrl(integration);
      this.debugRequest(integration, data);

      const response = await lastValueFrom(
        this.httpService.post<CMResponseArray<FollowUpAppointmentsResponse>>(
          `${apiUrl}/agendamentoonlines/ListarPossiveisRetornos`,
          data,
          {
            headers: {
              ...(await this.getDefaultHeaders(integration)),
            },
          },
        ),
      );

      if (
        !this.handleResponseError(
          integration,
          response,
          data,
          'getFollowUpPatientAppointments',
          undefined,
          ignoreException,
        )
      ) {
        return response.data?.[0];
      }
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }
}
