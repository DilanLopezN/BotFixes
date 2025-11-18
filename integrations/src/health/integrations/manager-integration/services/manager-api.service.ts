import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import {
  ManagerAppointmentTypeResponse,
  ManagerAuthParamsRequest,
  ManagerAuthResponse,
  ManagerAvailableSchedules,
  ManagerAvailableSchedulesResponse,
  ManagerCancelScheduleResponse,
  ManagerConfirmScheduleResponse,
  ManagerCreatePatienResponse,
  ManagerCreatePatient,
  ManagerCreateSchedule,
  ManagerCreateScheduleExam,
  ManagerCreateScheduleResponse,
  ManagerDoctorsParamsRequest,
  ManagerDoctorsResponse,
  ManagerInsurancePlansParamsRequest,
  ManagerInsurancePlansResponse,
  ManagerInsurancesParamsRequest,
  ManagerInsurancesResponse,
  ManagerOrganizationUnitsResponse,
  ManagerPatientAuthParamsRequest,
  ManagerPatientAuthResponse,
  ManagerPatientExistsParamsRequest,
  ManagerPatientResponse,
  ManagerPatientSchedules,
  ManagerPatientSchedulesResponse,
  ManagerProceduresExamsParamsRequest,
  ManagerProceduresParamsRequest,
  ManagerProceduresResponse,
  ManagerResourceDoctorDetailsParamsRequest,
  ManagerResourceDoctorDetailsResponse,
  ManagerScheduleValue,
  ManagerScheduleValueResponse,
  ManagerSpecialitiesExamsParamsRequest,
  ManagerSpecialitiesParamsRequest,
  ManagerSpecialitiesResponse,
  ManagerUpdatePatient,
} from '../interfaces';
import * as contextService from 'request-context';
import * as Sentry from '@sentry/node';
import { AxiosRequestConfig } from 'axios';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { PUBLIC_TOKEN_CACHE_EXPIRATION } from '../defaults';
import { PATIENT_CACHE_EXPIRATION } from '../../../integration-cache-utils/cache-expirations';
import { AuditDataType } from '../../../audit/audit.interface';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { cleanseObject } from '../../../../common/helpers/cleanse-object';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { ManagerCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

interface PatientDataToAuth {
  cpf: string;
  bornDate: string;
}

@Injectable()
export class ManagerApiService {
  private readonly logger = new Logger(ManagerApiService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.MANAGER).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
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
        message: `${integration._id}:${integration.name}:MANAGER-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
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

  private debugRequest(integration: IntegrationDocument, payload: any, funcName: string) {
    if (!integration.debug) {
      return;
    }

    this.logger.debug(`${integration._id}:${integration.name}:MANAGER-debug`, payload);
  }

  private async getApiUrl(integration: IntegrationDocument, url: string): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<ManagerCredentialsResponse>(integration);
    return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  private async getDefaultAuthPayload(integration: IntegrationDocument): Promise<ManagerAuthParamsRequest> {
    const { apiUsername: username, apiPassword: password } =
      await this.credentialsHelper.getConfig<ManagerCredentialsResponse>(integration);

    return {
      password,
      username,
    };
  }

  private async getPublicParams(
    integration: IntegrationDocument,
    renewToken?: boolean,
  ): Promise<Pick<AxiosRequestConfig, 'headers'>> {
    let publicToken = await this.integrationCacheUtilsService.getPublicTokenFromCache(integration);

    // caso o cliente possua um token sem expiração
    const { apiToken } = await this.credentialsHelper.getConfig<ManagerCredentialsResponse>(integration);

    if (apiToken) {
      return {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      };
    }

    if (!publicToken || renewToken) {
      const response = await this.defaultAuth(integration);

      if (response?.token) {
        await this.integrationCacheUtilsService.setPublicTokenCache(
          integration,
          response.token,
          PUBLIC_TOKEN_CACHE_EXPIRATION,
        );

        publicToken = response.token;
      } else {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          `Cannot authenticate: ${integration._id}`,
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }
    }

    return {
      headers: {
        Authorization: `Bearer ${publicToken}`,
      },
    };
  }

  private async getPatientParams(
    integration: IntegrationDocument,
    patient: PatientDataToAuth,
    renewToken?: boolean,
  ): Promise<Pick<AxiosRequestConfig, 'headers'>> {
    if (!patient?.cpf || !patient?.bornDate) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        `Cannot authenticate patient: ${integration._id}`,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    let patientToken = await this.integrationCacheUtilsService.getPatientTokenFromCache(integration, patient.cpf);

    if (!patientToken || renewToken) {
      await this.getPublicParams(integration);
      const response = await this.patientAuth(integration, {
        cpfOrProtocolo: patient.cpf,
        dataNascimento: patient.bornDate,
      });

      if (response?.token) {
        await this.integrationCacheUtilsService.setPatientTokenCache(
          integration,
          patient.cpf,
          response.token,
          PATIENT_CACHE_EXPIRATION,
        );

        patientToken = response.token;
      } else {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          `Cannot authenticate patient: ${integration._id}`,
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }
    }

    return {
      headers: {
        Authorization: `Bearer ${patientToken}`,
      },
    };
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: ManagerCreatePatient,
    isRetry?: boolean,
  ): Promise<ManagerCreatePatienResponse> {
    const methodName = 'createPatient';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}
    this.debugRequest(integration, payload, this.createPatient.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/pacientes/cadastrar-com-usuario/');
      const response = await lastValueFrom(this.httpService.post<ManagerCreatePatienResponse>(apiUrl, payload, config));

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.createPatient(integration, payload, true);
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
    payload: ManagerUpdatePatient,
    patient: PatientDataToAuth,
    isRetry?: boolean,
  ): Promise<ManagerPatientResponse> {
    const methodName = 'updatePatient';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    this.debugRequest(integration, payload, this.updatePatient.name);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPatientParams(integration, patient);
      const apiUrl = await this.getApiUrl(integration, '/agendador/pacientes/atualizar/');
      const response = await lastValueFrom(this.httpService.put<ManagerPatientResponse>(apiUrl, payload, config));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPatientParams(integration, patient, true);
        return this.updatePatient(integration, payload, patient, true);
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPatientSchedules(
    integration: IntegrationDocument,
    params: ManagerPatientSchedules,
    isRetry?: boolean,
  ): Promise<{ content: ManagerPatientSchedulesResponse[] }> {
    try {
      params = cleanseObject(params);
    } catch (error) {}
    this.debugRequest(integration, params, this.listPatientSchedules.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/atendimento/agendamentos/todos/');
      const response = await lastValueFrom(
        this.httpService.get<{ content: ManagerPatientSchedulesResponse[] }>(apiUrl, {
          ...config,
          params: {
            ...params,
            pagina: 0,
            registrosPorPagina: 100,
          },
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'listPatientSchedules');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listPatientSchedules(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    scheduleCode: number,
    isRetry?: boolean,
  ): Promise<ManagerCancelScheduleResponse> {
    const methodName = 'cancelSchedule';

    this.debugRequest(integration, { scheduleCode }, this.cancelSchedule.name);
    this.dispatchAuditEvent(integration, { scheduleCode }, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, `/atendimento/agendamentos/${scheduleCode}/cancelar`);
      const response = await lastValueFrom(
        this.httpService.put<ManagerCancelScheduleResponse>(apiUrl, undefined, config),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { scheduleCode }, 'cancelSchedule');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.cancelSchedule(integration, scheduleCode, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    scheduleCode: number,
    isRetry?: boolean,
  ): Promise<ManagerConfirmScheduleResponse> {
    const methodName = 'confirmSchedule';

    this.debugRequest(integration, { scheduleCode }, this.confirmSchedule.name);
    this.dispatchAuditEvent(integration, { scheduleCode }, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, `/atendimento/agendamentos/${scheduleCode}/confirmar`);
      const response = await lastValueFrom(
        this.httpService.put<ManagerConfirmScheduleResponse>(apiUrl, undefined, config),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { scheduleCode }, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.confirmSchedule(integration, scheduleCode, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getScheduleValue(
    integration: IntegrationDocument,
    params: ManagerScheduleValue,
    isRetry?: boolean,
  ): Promise<ManagerScheduleValueResponse> {
    const methodName = 'getScheduleValue';

    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.getScheduleValue.name);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/servicos/valores');
      const response = await lastValueFrom(
        this.httpService.get<ManagerScheduleValueResponse>(apiUrl, {
          ...config,
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.getScheduleValue(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    isRetry?: boolean,
    ignoreException?: boolean,
  ): Promise<ManagerOrganizationUnitsResponse[]> {
    this.debugRequest(integration, {}, this.listOrganizationUnits.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/unidade-filial');
      const request = await lastValueFrom(
        this.httpService.get<ManagerOrganizationUnitsResponse[]>(apiUrl, {
          ...config,
          params: {
            disponivelWeb: true,
          },
        }),
      );

      return request?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listOrganizationUnits', ignoreException);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listOrganizationUnits(integration, true, ignoreException);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    params: ManagerInsurancesParamsRequest,
    isRetry?: boolean,
    ignoreException?: boolean,
  ): Promise<ManagerInsurancesResponse[]> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.listInsurances.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/convenios');
      const request = await lastValueFrom(
        this.httpService.get<ManagerInsurancesResponse[]>(apiUrl, {
          ...config,
          params: {
            ...params,
            disponivelWeb: true,
          },
        }),
      );

      return request?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, 'listInsurances', ignoreException);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listInsurances(integration, params, true, ignoreException);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    params: ManagerInsurancePlansParamsRequest,
    isRetry?: boolean,
  ): Promise<ManagerInsurancePlansResponse[]> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.listInsurancePlans.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/planos');
      const request = await lastValueFrom(
        this.httpService.get<ManagerInsurancePlansResponse[]>(apiUrl, {
          ...config,
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, 'listInsurancePlans');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listInsurancePlans(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    params: ManagerDoctorsParamsRequest,
    isRetry?: boolean,
  ): Promise<ManagerDoctorsResponse[]> {
    const methodName = 'listDoctors';

    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.listDoctors.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/medicos');
      const response = await lastValueFrom(
        this.httpService.get<ManagerDoctorsResponse[]>(apiUrl, {
          ...config,
          params: {
            ...params,
            disponivelWeb: true,
          },
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listDoctors(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getResourceDoctorDetails(
    integration: IntegrationDocument,
    params: ManagerResourceDoctorDetailsParamsRequest,
    isRetry?: boolean,
  ): Promise<ManagerResourceDoctorDetailsResponse> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.getResourceDoctorDetails.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/recurso-medico');
      const request = await lastValueFrom(
        this.httpService.get<ManagerResourceDoctorDetailsResponse>(apiUrl, {
          ...config,
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, 'getResourceDoctorDetails');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.getResourceDoctorDetails(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAppointmentTypes(
    integration: IntegrationDocument,
    isRetry?: boolean,
  ): Promise<ManagerAppointmentTypeResponse[]> {
    this.debugRequest(integration, {}, this.listAppointmentTypes.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/servicos/tipos-agendamento');
      const request = await lastValueFrom(this.httpService.get<ManagerAppointmentTypeResponse[]>(apiUrl, config));

      return request?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listAppointmentTypes');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listAppointmentTypes(integration, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    params: ManagerSpecialitiesParamsRequest,
    isRetry?: boolean,
  ): Promise<ManagerSpecialitiesResponse[]> {
    const methodName = 'listSpecialities';

    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.listSpecialities.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/especialidades');
      const response = await lastValueFrom(
        this.httpService.get<ManagerSpecialitiesResponse[]>(apiUrl, {
          ...config,
          params: {
            ...params,
            disponivelWeb: true,
          },
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listSpecialities(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    params: ManagerProceduresParamsRequest,
    isRetry?: boolean,
  ): Promise<ManagerProceduresResponse[]> {
    const methodName = 'listProcedures';

    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.listProcedures.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/servicos/por-especialidade-e-convenio');
      const response = await lastValueFrom(
        this.httpService.get<ManagerProceduresResponse[]>(apiUrl, {
          ...config,
          params: {
            ...params,
            disponivelWeb: true,
          },
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listProcedures(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProceduresExams(
    integration: IntegrationDocument,
    params: ManagerProceduresExamsParamsRequest,
    isRetry?: boolean,
  ): Promise<ManagerProceduresResponse[]> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.listProceduresExams.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/servicos');
      const request = await lastValueFrom(
        this.httpService.get<ManagerProceduresResponse[]>(apiUrl, {
          ...config,
          params: {
            ...params,
            disponivelWeb: true,
          },
        }),
      );

      return request?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, 'listProceduresExams');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listProceduresExams(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProceduresExamsGroups(
    integration: IntegrationDocument,
    params: ManagerSpecialitiesExamsParamsRequest,
    isRetry?: boolean,
  ): Promise<ManagerSpecialitiesResponse[]> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.listProceduresExamsGroups.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/grupo-servicos');
      const request = await lastValueFrom(
        this.httpService.get<ManagerSpecialitiesResponse[]>(apiUrl, {
          ...config,
          params: {
            ...params,
            disponivelWeb: true,
          },
        }),
      );

      return request?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, 'listProceduresExamsGroups');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listProceduresExamsGroups(integration, params, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableSchedules(
    integration: IntegrationDocument,
    payload: ManagerAvailableSchedules,
    isRetry?: boolean,
  ): Promise<ManagerAvailableSchedulesResponse[]> {
    const methodName = 'listAvailableSchedules';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    this.debugRequest(integration, payload, this.listAvailableSchedules.name);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agenda/nova-busca-inteligente');
      const response = await lastValueFrom(
        this.httpService.post<ManagerAvailableSchedulesResponse[]>(apiUrl, [payload], config),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, 'listAvailableSchedules');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.listAvailableSchedules(integration, payload, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    payload: ManagerCreateSchedule,
    patient: PatientDataToAuth,
    isRetry?: boolean,
  ): Promise<ManagerCreateScheduleResponse> {
    const methodName = 'createSchedule';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    this.debugRequest(integration, payload, this.createSchedule.name);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/atendimento/agendamentos/consultas');
      const response = await lastValueFrom(
        this.httpService.post<ManagerCreateScheduleResponse>(apiUrl, payload, config),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration);
        return this.createSchedule(integration, payload, patient, true);
      }

      if (error?.response?.status === HttpStatus.BAD_REQUEST && error?.response?.data?.code === 'horario.ocupado') {
        throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
      }

      if (
        error?.response?.status === HttpStatus.BAD_REQUEST &&
        error?.response?.data?.code === 'service.already.scheduled'
      ) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.NOT_ACCEPTABLE,
          'Service already scheduled',
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createScheduleExam(
    integration: IntegrationDocument,
    payload: ManagerCreateScheduleExam,
    patient: PatientDataToAuth,
    isRetry?: boolean,
  ): Promise<ManagerCreateScheduleResponse> {
    const methodName = 'createScheduleExam';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    this.debugRequest(integration, payload, this.createScheduleExam.name);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/atendimento/agendamentos/exames');
      const response = await lastValueFrom(
        this.httpService.post<ManagerCreateScheduleResponse>(apiUrl, payload, config),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration);
        return this.createScheduleExam(integration, payload, patient, true);
      }

      if (error?.response?.status === HttpStatus.BAD_REQUEST && error?.response?.data?.code === 'horario.ocupado') {
        throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
      }

      if (
        error?.response?.status === HttpStatus.BAD_REQUEST &&
        error?.response?.data?.code === 'service.already.scheduled'
      ) {
        // no exame retorna quando ja tem um exame no mesmo dia agendado aparentemente
        throw HTTP_ERROR_THROWER(
          HttpStatus.NOT_ACCEPTABLE,
          'Service already scheduled',
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async defaultAuth(integration: IntegrationDocument): Promise<ManagerAuthResponse> {
    const payload = await this.getDefaultAuthPayload(integration);
    this.debugRequest(integration, {}, this.defaultAuth.name);

    try {
      const apiUrl = await this.getApiUrl(integration, '/agendador/auth/login');
      const response = await lastValueFrom(this.httpService.post<ManagerAuthResponse>(apiUrl, payload));

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, 'defaultAuth');
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async patientAuth(
    integration: IntegrationDocument,
    payload: ManagerPatientAuthParamsRequest,
    isRetry?: boolean,
  ): Promise<ManagerPatientAuthResponse> {
    this.debugRequest(integration, {}, this.patientAuth.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/auth/gera-token-paciente');
      const response = await lastValueFrom(
        this.httpService.post<ManagerPatientAuthResponse>(apiUrl, payload, {
          ...config,
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, 'patientAuth');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.patientAuth(integration, payload, true);
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async checkPatientExists(
    integration: IntegrationDocument,
    params: ManagerPatientExistsParamsRequest,
    isRetry?: boolean,
  ): Promise<boolean> {
    this.debugRequest(integration, params, this.checkPatientExists.name);

    try {
      const config = await this.getPublicParams(integration);
      const apiUrl = await this.getApiUrl(integration, '/agendador/pacientes/cpf/');
      const response = await lastValueFrom(
        this.httpService.get<boolean>(apiUrl, {
          ...config,
          params,
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'checkPatientExists');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPublicParams(integration, true);
        return this.checkPatientExists(integration, params, true);
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAuthenticatedPatient(
    integration: IntegrationDocument,
    patient: PatientDataToAuth,
    isRetry?: boolean,
  ): Promise<ManagerPatientResponse> {
    this.debugRequest(integration, patient, this.getAuthenticatedPatient.name);

    try {
      const config = await this.getPatientParams(integration, patient);
      const apiUrl = await this.getApiUrl(integration, '/agendador/pacientes/listar/');
      const response = await lastValueFrom(
        this.httpService.get<ManagerPatientResponse>(apiUrl, {
          ...config,
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'getAuthenticatedPatient');
      if (error?.response?.status === HttpStatus.UNAUTHORIZED && !isRetry) {
        await this.getPatientParams(integration, patient, true);
        return this.getAuthenticatedPatient(integration, patient, true);
      }

      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
