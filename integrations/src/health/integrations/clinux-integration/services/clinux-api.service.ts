import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import {
  ClinuxDoctorsParamsRequest,
  ClinuxDoctorsResponse,
  ClinuxExternalResultDownloadRequest,
  ClinuxExternalResultRequest,
  ClinuxExternalResultResponse,
  ClinuxInsurancePlansParamsRequest,
  ClinuxInsurancePlansResponse,
  ClinuxInsurancesParamsRequest,
  ClinuxInsurancesResponse,
  ClinuxOrganizationsParamsRequest,
  ClinuxOrganizationsResponse,
  ClinuxProcedureGuidanceParamsRequest,
  ClinuxProcedureGuidanceResponse,
  ClinuxProceduresParamsRequest,
  ClinuxProceduresResponse,
  ClinuxProcedureValueParamsRequest,
  ClinuxProcedureValueResponse,
  ClinuxResultDownloadRequest,
  ClinuxSpecialitiesParamsRequest,
  ClinuxSpecialitiesResponse,
} from '../interfaces/base-register.interface';
import * as contextService from 'request-context';
import {
  ClinuxCancelScheduleParamsRequest,
  ClinuxCancelScheduleResponse,
  ClinuxConfirmScheduleParamsRequest,
  ClinuxConfirmScheduleResponse,
  ClinuxCreateScheduleParamsRequest,
  ClinuxCreateScheduleResponse,
  ClinuxListAvailableSchedulesParamsRequest,
  ClinuxListAvailableSchedulesParamsRequestV2,
  ClinuxListAvailableSchedulesResponse,
  ClinuxListAvailableSchedulesResponseV2,
  ClinuxListPatientAttendanceParamsRequest,
  ClinuxListPatientAttendanceParamsResponse,
  ClinuxListPatientSchedulesParamsRequest,
  ClinuxListPatientSchedulesResponse,
} from '../interfaces/schedule.interface';
import {
  ClinuxCreatePatientParamsRequest,
  ClinuxCreatePatientResponse,
  ClinuxGetPatientParamsRequest,
  ClinuxGetPatientResponse,
  ClinuxUpdatePatientParamsRequest,
  ClinuxUpdatePatientResponse,
} from '../interfaces/patient.interface';
import { AuthResponse, PatientAuthParamsRequest, PatientAuthResponse } from '../interfaces/auth.interface';
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
export class ClinuxApiService {
  private readonly logger = new Logger(ClinuxApiService.name);
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

    if (error?.response?.data && !ignoreException) {
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:CLINUX-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error?.response, metadata),
      });
    }
  }

  private async getApiUrl(integration: IntegrationDocument): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<ClinuxCredentialsResponse>(integration);

    if (!apiUrl) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'invalid api url',
      });
    }

    return apiUrl;
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
    await this.cacheService.set(token, `CLINUX:TOKEN:${integration._id}`, 14_000);
  }

  private async getClinuxIntegrationToken(integration: IntegrationDocument): Promise<string | null> {
    return await this.cacheService.get(`CLINUX:TOKEN:${integration._id}`);
  }

  public async getOrganizationUnits(
    integration: IntegrationDocument,
    params: ClinuxOrganizationsParamsRequest,
    ignoreException?: boolean,
  ): Promise<ClinuxOrganizationsResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxOrganizationsResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaEmpresa`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getOrganizationUnits', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurances(
    integration: IntegrationDocument,
    params?: ClinuxInsurancesParamsRequest,
  ): Promise<ClinuxInsurancesResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxInsurancesResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaPlano`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getInsurances');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getDoctors(
    integration: IntegrationDocument,
    params: ClinuxDoctorsParamsRequest,
  ): Promise<ClinuxDoctorsResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxDoctorsResponse[]>(`${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaMedico`, undefined, {
          params: requestParams,
        }),
      );

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

  public async getSpecialities(
    integration: IntegrationDocument,
    params?: ClinuxSpecialitiesParamsRequest,
  ): Promise<ClinuxSpecialitiesResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxSpecialitiesResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaModalidade`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getSpecialities');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurancePlans(
    integration: IntegrationDocument,
    params: ClinuxInsurancePlansParamsRequest,
  ): Promise<ClinuxInsurancePlansResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxInsurancePlansResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaSubPlano`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getInsurances');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedures(
    integration: IntegrationDocument,
    params: ClinuxProceduresParamsRequest,
  ): Promise<ClinuxProceduresResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxProceduresResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaProcedimento`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getProcedures');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedureValue(
    integration: IntegrationDocument,
    params: ClinuxProcedureValueParamsRequest,
  ): Promise<ClinuxProcedureValueResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxProcedureValueResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doProcedimentoValor`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getProcedureValue');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async patientLogin(
    integration: IntegrationDocument,
    params: PatientAuthParamsRequest,
  ): Promise<PatientAuthResponse[]> {
    try {
      this.debugRequest(integration, params);
      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<PatientAuthResponse[]>(`${apiUrl}/cgi-bin/dwserver.cgi/se1/doPacienteLogin`, undefined, {
          params,
        }),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'patientLogin');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  private async setClinuxPatientToken(integration: IntegrationDocument, token: string, cpf: string): Promise<void> {
    await this.cacheService.set(token, `CLINUX:PATIENT:TOKEN:${integration._id}_${cpf}`, 14_000);
  }

  private async getClinuxPatientToken(integration: IntegrationDocument, cpf: string): Promise<string | null> {
    return await this.cacheService.get(`CLINUX:PATIENT:TOKEN:${integration._id}_${cpf}`);
  }

  public getDefaultPatientToAuth() {
    // usuário que sera criado em cada cliente para efetuar requests que precisam de
    // um token de paciente
    return {
      bornDate: '2000-01-01',
      cpf: '08713369016',
      name: 'BOTDESIGNER TECNOLOGIA',
      phone: '48998989898',
      email: 'botdesigner@yopmail.com',
      cellPhone: '48998989898',
      password: 'psjvphvhylhs',
    };
  }

  // utilizado para buscar horários e criar atendimento
  // deveria ser o token do proprio usuário que está criando o agendamento,
  // mas clinux passou que podemos ter um usuário padrão em cada integração para isso

  private async getDefaultPatientToken(integration: IntegrationDocument): Promise<string> {
    const defaultPatient = this.getDefaultPatientToAuth();

    let patientToken = await this.getClinuxPatientToken(integration, defaultPatient.cpf);

    if (!patientToken) {
      const tokenResponse = await this.patientLogin(integration, {
        id: defaultPatient.cpf,
        pw: defaultPatient.password,
      });

      patientToken = tokenResponse?.[0]?.ds_token;
      await this.setClinuxPatientToken(integration, patientToken, defaultPatient.cpf);
    }

    if (!patientToken) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.UNAUTHORIZED,
        'não foi possivel obter o token do paciente',
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    return patientToken;
  }

  public async listAvailableSchedules(
    integration: IntegrationDocument,
    params: ClinuxListAvailableSchedulesParamsRequest,
  ): Promise<ClinuxListAvailableSchedulesResponse[]> {
    const methodName = 'listAvailableSchedules';

    try {
      const defaultPatientToken = await this.getDefaultPatientToken(integration);
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);
      this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxListAvailableSchedulesResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doAgendaSemanal`,
          undefined,
          {
            params: {
              ...requestParams,
              token: defaultPatientToken,
            },
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'listAvailableSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableSchedulesV2(
    integration: IntegrationDocument,
    params: ClinuxListAvailableSchedulesParamsRequestV2,
  ): Promise<ClinuxListAvailableSchedulesResponseV2[]> {
    const methodName = 'listAvailableSchedulesV2';

    try {
      const defaultPatientToken = await this.getDefaultPatientToken(integration);
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);
      this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxListAvailableSchedulesResponseV2[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/getAvailabilities`,
          undefined,
          {
            params: {
              ...requestParams,
              token: defaultPatientToken,
            },
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'listAvailableSchedulesV2');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    params: ClinuxCreateScheduleParamsRequest,
  ): Promise<ClinuxCreateScheduleResponse[]> {
    const methodName = 'createSchedule';

    try {
      const defaultPatientToken = await this.getDefaultPatientToken(integration);
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);
      this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxCreateScheduleResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doAgendaPost`,
          undefined,
          {
            params: { ...requestParams, token: defaultPatientToken },
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'createSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPatientSchedules(
    integration: IntegrationDocument,
    params: ClinuxListPatientSchedulesParamsRequest,
  ): Promise<ClinuxListPatientSchedulesResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxListPatientSchedulesResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaAgendamento`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'listPatientSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPatientAttendances(
    integration: IntegrationDocument,
    params: ClinuxListPatientAttendanceParamsRequest,
  ): Promise<ClinuxListPatientAttendanceParamsResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxListPatientAttendanceParamsResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaAtendimento`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'listPatientAttendances');
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

  public async updatePatient(
    integration: IntegrationDocument,
    params: ClinuxUpdatePatientParamsRequest,
  ): Promise<ClinuxUpdatePatientResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxUpdatePatientResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doPacienteTabela`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'updatePatient');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    params: ClinuxCreatePatientParamsRequest,
  ): Promise<ClinuxCreatePatientResponse[]> {
    const methodName = 'createPatient';

    try {
      const requestParams = await this.getDefaultRequestParams(integration, params);
      this.debugRequest(integration, requestParams);
      this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxCreatePatientResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doPacienteTabela`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'updatePatient');
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
        this.httpService.post<AuthResponse[]>(`${apiUrl}/cgi-bin/dwserver.cgi/se1/doFuncionarioLogin`, undefined, {
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

  public async renewToken(integration: IntegrationDocument): Promise<AuthResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration);
      this.debugRequest(integration, requestParams);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<AuthResponse[]>(`${apiUrl}/cgi-bin/dwserver.cgi/se1/doGetToken`, undefined, {
          params: requestParams,
        }),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'renewToken');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatient(
    integration: IntegrationDocument,
    payload: ClinuxGetPatientParamsRequest,
  ): Promise<ClinuxGetPatientResponse[]> {
    try {
      if (!payload.cd_paciente && !payload.ds_cpf) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, 'Invalid patient params');
      }

      const requestParams = await this.getDefaultRequestParams(integration, payload);
      this.debugRequest(integration, payload);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxGetPatientResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaPaciente`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getPatient');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSchedules(
    integration: IntegrationDocument,
    payload: ClinuxListSchedulesParamsRequest,
  ): Promise<ClinuxSchedule[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, payload);
      this.debugRequest(integration, payload);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxSchedule[]>(`${apiUrl}/cgi-bin/dwserver.cgi/se1/doListaConfirmacao`, undefined, {
          params: requestParams,
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

  public async getExternalResultsList(
    integration: IntegrationDocument,
    payload: ClinuxExternalResultRequest,
  ): Promise<ClinuxExternalResultResponse[]> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, payload);
      this.debugRequest(integration, payload);

      const apiUrl = await this.getApiUrl(integration);
      const response = await lastValueFrom(
        this.httpService.post<ClinuxExternalResultResponse[]>(
          `${apiUrl}/cgi-bin/dwserver.cgi/se1/doLaudoExternoLista`,
          undefined,
          {
            params: requestParams,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getExternalResultsList');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  private async getExternalResultFileDownloadClinuxUrl(integration: IntegrationDocument): Promise<string> {
    const apiUrl = await this.getApiUrl(integration);

    return `${apiUrl}/cgi-bin/dwserver.cgi/www/doLaudoExternoDownload`;
  }

  public async getExternalResultFileDownload(
    integration: IntegrationDocument,
    payload: ClinuxExternalResultDownloadRequest,
  ): Promise<Buffer> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, payload);
      this.debugRequest(integration, payload);

      const response = await lastValueFrom(
        this.httpService.post<any>(await this.getExternalResultFileDownloadClinuxUrl(integration), undefined, {
          params: requestParams,
          responseType: 'arraybuffer',
        }),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getExternalResultFileDownload');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  private async getResultFileDownloadClinuxUrl(integration: IntegrationDocument): Promise<string> {
    const apiUrl = await this.getApiUrl(integration);

    return `${apiUrl}/cgi-bin/dwserver.cgi/www/doLaudoDownload`;
  }

  public async getResultFileDownload(
    integration: IntegrationDocument,
    payload: ClinuxResultDownloadRequest,
  ): Promise<Buffer> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, payload);
      this.debugRequest(integration, payload);

      const response = await lastValueFrom(
        this.httpService.post<any>(await this.getResultFileDownloadClinuxUrl(integration), undefined, {
          params: requestParams,
          responseType: 'arraybuffer',
        }),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getResultFileDownload');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getExternalResultFileDownloadUrl(
    integration: IntegrationDocument,
    payload: ClinuxExternalResultDownloadRequest,
  ): Promise<string> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, payload);
      this.debugRequest(integration, payload);

      const response = `${await this.getExternalResultFileDownloadClinuxUrl(integration)}?${new URLSearchParams(requestParams).toString()}`;

      return response;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getExternalResultFileDownloadUrl');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getResultFileDownloadUrl(
    integration: IntegrationDocument,
    payload: ClinuxResultDownloadRequest,
  ): Promise<string> {
    try {
      const requestParams = await this.getDefaultRequestParams(integration, payload);
      this.debugRequest(integration, payload);

      const response = `${await this.getResultFileDownloadClinuxUrl(integration)}?${new URLSearchParams(requestParams).toString()}`;

      return response;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getResultFileDownloadUrl');
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error, HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }
}
