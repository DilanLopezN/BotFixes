import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import {
  FeegowResponseArray,
  FeegowResponsePlain,
  FeegowPatientByCodeResponse,
  FeegowPatientByCpfResponse,
  FeegowCreatePatient,
  FeegowCreatePatientResponse,
  FeegowOrganizationsResponse,
  FeegowSpecialitiesResponse,
  FeegowInsurancesResponse,
  FeegowProceduresResponse,
  FeegowUpdatePatient,
  FeegowInsurancesParamsRequest,
  FeegowSpecialitiesParamsRequest,
  FeegowOrganizationUnitsParamsRequest,
  FeegowDoctorsParamsRequest,
  FeegowDoctorsResponse,
  FeegowProceduresParamsRequest,
  FeegowAppointmentTypesParamsRequest,
  FeegowAppointmentTypesResponse,
  FeegowCancelSchedule,
  FeegowConfirmSchedule,
  FeegowConfirmScheduleResponse,
  FeegowCreateSchedule,
  FeegowCreateScheduleResponse,
  FeegowAvailableSchedules,
  FeegowAvailableSchedulesResponse,
  FeegowPatientSchedules,
  FeegowScheduleResponse,
  FeegowReschedule,
  FeegowDoctorsInsurancesParamsRequest,
  FeegowDoctorsInsurancesResponse,
} from './../interfaces';
import * as Sentry from '@sentry/node';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { lastValueFrom } from 'rxjs';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import * as contextService from 'request-context';
import { AuditDataType } from '../../../audit/audit.interface';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { FeegowCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class FeegowApiService {
  private logger = new Logger(FeegowApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.FEEGOW).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  private debugRequest(integration: IntegrationDocument, payload: Record<any, any>) {
    if (!integration.debug) {
      return;
    }

    this.logger.debug(`${integration._id}:${integration.name}:SI-debug`, payload);
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

  private async handleResponseError(
    integration: IntegrationDocument,
    error: any,
    payload: any,
    from: string,
    ignoreException = false,
  ) {
    this.auditService.sendAuditEvent({
      dataType: AuditDataType.externalResponseError,
      integrationId: castObjectIdToString(integration._id),
      data: {
        data: formatException(error),
      },
      identifier: from,
    });

    if (error?.response?.data && !ignoreException) {
      const metadata = contextService.get('req:default-headers');
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:FEEGOW-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private async getHeaders(integration: IntegrationDocument) {
    const { apiToken } = await this.credentialsHelper.getConfig<FeegowCredentialsResponse>(integration);

    if (!apiToken) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'Invalid api token',
      });
    }

    return {
      headers: {
        'x-access-token': `${apiToken}`,
      },
    };
  }

  public async getPatientByCode(
    integration: IntegrationDocument,
    code: string,
  ): Promise<FeegowResponsePlain<FeegowPatientByCodeResponse>> {
    this.debugRequest(integration, { code });
    const methodName = 'getPatientByCode';
    this.dispatchAuditEvent(integration, { code }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponsePlain<FeegowPatientByCodeResponse>>('/patient/search', {
          ...(await this.getHeaders(integration)),
          params: {
            paciente_id: code,
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { code }, 'getPatientByCode');
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientByCpf(
    integration: IntegrationDocument,
    cpf: string,
  ): Promise<FeegowResponseArray<FeegowPatientByCpfResponse>> {
    this.debugRequest(integration, { cpf });

    const methodName = 'getPatientByCpf';
    this.dispatchAuditEvent(integration, { cpf }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponseArray<FeegowPatientByCpfResponse>>('/patient/list', {
          ...(await this.getHeaders(integration)),
          params: {
            cpf,
          },
        }),
      );

      if (!response?.data?.content?.length) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { cpf }, 'getPatientByCpf');
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: FeegowCreatePatient,
  ): Promise<FeegowResponsePlain<FeegowCreatePatientResponse>> {
    const methodName = 'createPatient';
    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<FeegowResponsePlain<FeegowCreatePatientResponse>>('/patient/create', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'createPatient');
      if (error?.response?.status === HttpStatus.BAD_REQUEST) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error.response?.data, HttpErrorOrigin.INTEGRATION_ERROR);
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    payload: FeegowUpdatePatient,
  ): Promise<FeegowResponsePlain<string>> {
    const methodName = 'updatePatient';

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<FeegowResponsePlain<string>>('/patient/edit', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'updatePatient');
      if (error?.response?.status === HttpStatus.BAD_REQUEST) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error.response?.data, HttpErrorOrigin.INTEGRATION_ERROR);
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getOrganizationUnits(
    integration: IntegrationDocument,
    params?: FeegowOrganizationUnitsParamsRequest,
    ignoreException?: boolean,
  ): Promise<FeegowResponsePlain<FeegowOrganizationsResponse>> {
    this.debugRequest(integration, params);

    const methodName = 'getOrganizationUnits';
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponsePlain<FeegowOrganizationsResponse>>('/company/list-unity', {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getOrganizationUnits', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getDoctors(
    integration: IntegrationDocument,
    params?: FeegowDoctorsParamsRequest,
  ): Promise<FeegowResponseArray<FeegowDoctorsResponse>> {
    this.debugRequest(integration, params);

    const methodName = 'getDoctors';
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponseArray<FeegowDoctorsResponse>>('/professional/list', {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getDoctors');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getDoctorsInsurances(
    integration: IntegrationDocument,
    params?: FeegowDoctorsInsurancesParamsRequest,
  ): Promise<FeegowResponseArray<FeegowDoctorsInsurancesResponse>> {
    this.debugRequest(integration, params);

    const methodName = 'getDoctorsInsurances';
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponseArray<FeegowDoctorsInsurancesResponse>>('/professional/insurance', {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getDoctorsInsurances');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getSpecialities(
    integration: IntegrationDocument,
    params?: FeegowSpecialitiesParamsRequest,
  ): Promise<FeegowResponseArray<FeegowSpecialitiesResponse>> {
    this.debugRequest(integration, params);

    const methodName = 'getSpecialities';
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponseArray<FeegowSpecialitiesResponse>>('/specialties/list', {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getSpecialities');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedures(
    integration: IntegrationDocument,
    params?: FeegowProceduresParamsRequest,
  ): Promise<FeegowResponseArray<FeegowProceduresResponse>> {
    this.debugRequest(integration, params);

    const methodName = 'getProcedures';
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponseArray<FeegowProceduresResponse>>('/procedures/list', {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getProcedures');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurances(
    integration: IntegrationDocument,
    params?: FeegowInsurancesParamsRequest,
  ): Promise<FeegowResponseArray<FeegowInsurancesResponse>> {
    this.debugRequest(integration, params);

    const methodName = 'getInsurances';
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponseArray<FeegowInsurancesResponse>>('/insurance/list', {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getInsurances');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAppointmentTypes(
    integration: IntegrationDocument,
    params?: FeegowAppointmentTypesParamsRequest,
  ): Promise<FeegowResponseArray<FeegowAppointmentTypesResponse>> {
    this.debugRequest(integration, params);

    const methodName = 'getAppointmentTypes';
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponseArray<FeegowAppointmentTypesResponse>>('/procedures/types', {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getAppointmentTypes');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    payload: FeegowCancelSchedule,
  ): Promise<FeegowResponsePlain<string>> {
    const methodName = 'cancelSchedule';

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<FeegowResponsePlain<string>>('/appoints/cancel-appoint', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'cancelSchedule');
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    payload: FeegowConfirmSchedule,
  ): Promise<FeegowResponsePlain<FeegowConfirmScheduleResponse>> {
    const methodName = 'confirmSchedule';

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<FeegowResponsePlain<FeegowConfirmScheduleResponse>>('/appoints/statusUpdate', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'updateScheduleStatus');
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    payload: FeegowCreateSchedule,
  ): Promise<FeegowResponsePlain<FeegowCreateScheduleResponse | string>> {
    const methodName = 'createSchedule';

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<FeegowResponsePlain<FeegowCreateScheduleResponse | string>>(
          '/appoints/new-appoint',
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'createSchedule');
      if (error?.response?.status === HttpStatus.CONFLICT) {
        if (error.response?.data?.content?.includes('bloqueio')) {
          throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule (BLOCKED)', HttpErrorOrigin.INTEGRATION_ERROR);
        }

        // Erro da Feegow quando paciente está fora da faixa etária de atendimento do médico
        if (error.response?.data?.content?.includes('Verifique a configuração do profissional')) {
          throw HTTP_ERROR_THROWER(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'Patient out of doctors attendance age range',
            undefined,
            true,
          );
        }

        throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
      }
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    params?: FeegowAvailableSchedules,
  ): Promise<FeegowResponsePlain<FeegowAvailableSchedulesResponse> | FeegowResponseArray<any>> {
    const methodName = 'listAvailableSchedules';

    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponsePlain<FeegowAvailableSchedulesResponse> | FeegowResponseArray<any>>(
          '/appoints/available-schedule',
          {
            ...(await this.getHeaders(integration)),
            params,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getAvailableSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSchedules(
    integration: IntegrationDocument,
    params?: FeegowPatientSchedules,
  ): Promise<FeegowResponseArray<FeegowScheduleResponse>> {
    this.debugRequest(integration, params);

    const methodName = 'listSchedules';
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<FeegowResponseArray<FeegowScheduleResponse>>('/appoints/search', {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'listSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async reschedule(
    integration: IntegrationDocument,
    payload: FeegowReschedule,
  ): Promise<FeegowResponsePlain<string>> {
    const methodName = 'reschedule';

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<FeegowResponsePlain<string>>('/appoints/reschedule', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'reschedule');
      if (error?.response?.status === HttpStatus.CONFLICT) {
        if (error.response?.data?.content?.includes('bloqueio')) {
          throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule (BLOCKED)', HttpErrorOrigin.INTEGRATION_ERROR);
        }

        throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
      }
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
