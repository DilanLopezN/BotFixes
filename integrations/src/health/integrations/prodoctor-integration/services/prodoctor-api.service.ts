import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import * as Sentry from '@sentry/node';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { lastValueFrom } from 'rxjs';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import * as contextService from 'request-context';
import { AuditDataType } from '../../../audit/audit.interface';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { ProdoctorCredentialsResponse } from '../interfaces/credentials.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

// ========== BASE INTERFACES ==========
import {
  UserSearchRequest,
  UserBasicListResponse,
  UserWithSpecialityListResponse,
  UserDetailsResponse,
  LocationSearchRequest,
  LocationListResponse,
  InsuranceSearchRequest,
  InsuranceListResponse,
  InsuranceDetailsResponse,
  ProcedureSearchRequest,
  ProcedureListResponse,
  ProcedureDetailsResponse,
  ProcedureTableSearchRequest,
  ProcedureTableListResponse,
} from '../interfaces/base.interface';

// ========== PATIENT INTERFACES ==========
import {
  PatientSearchRequest,
  PatientCrudRequest,
  PatientListResponse,
  PatientBasicResponse,
  PatientDetailsResponse,
} from '../interfaces/patient.interface';

// ========== SCHEDULE INTERFACES ==========
import {
  ListAppointmentsByUserRequest,
  SearchPatientAppointmentsRequest,
  InsertAppointmentRequest,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  UpdateAppointmentStateRequest,
  SearchAppointmentsByStatusRequest,
  AvailableTimesRequest,
  DayScheduleResponse,
  AppointmentsListResponse,
  AppointmentDetailsResponse,
  InsertedAppointmentResponse,
  AppointmentOperationResponse,
  AppointmentsByStatusResponse,
  UpdateAppointmentStateResponse,
  AvailableTimesResponse,
} from '../interfaces/schedule.interface';

@Injectable()
export class ProdoctorApiService {
  private readonly logger = new Logger(ProdoctorApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.PRODOCTOR).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  // ========== PRIVATE HELPERS ==========

  private debugRequest(integration: IntegrationDocument, payload: any): void {
    if (!integration.debug) {
      return;
    }
    this.logger.debug(`${integration._id}:${integration.name}:PRODOCTOR-debug`, payload);
  }

  private handleResponseError(
    integration: IntegrationDocument,
    error: any,
    payload: any,
    from: string,
    ignoreException = false,
  ): void {
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
        message: `${integration._id}:${integration.name}:PRODOCTOR-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error?.response, metadata),
      });
    }
  }

  private dispatchAuditEvent(
    integration: IntegrationDocument,
    data: any,
    identifier: string,
    dataType: AuditDataType,
  ): void {
    this.auditService.sendAuditEvent({
      dataType,
      integrationId: castObjectIdToString(integration._id),
      data: {
        data,
      },
      identifier,
    });
  }

  private async getApiUrl(integration: IntegrationDocument, endpoint: string): Promise<string> {
    const baseUrl =
      integration.environment === IntegrationEnvironment.production
        ? integration.apiUrl || 'https://api.prodoctor.com.br'
        : 'http://localhost:3001';

    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  private async getHeaders(integration: IntegrationDocument): Promise<{ headers: Record<string, string> }> {
    const { apiKey, apiPassword } = await this.credentialsHelper.getConfig<ProdoctorCredentialsResponse>(integration);

    if (!apiKey || !apiPassword) {
      throw HTTP_ERROR_THROWER(HttpStatus.UNAUTHORIZED, 'Invalid ProDoctor credentials');
    }

    return {
      headers: {
        'Content-Type': 'application/json',
        'X-APIKEY': apiKey,
        'X-APIPASSWORD': apiPassword,
        'X-APITIMEZONE': '-03:00',
        'X-APITIMEZONENAME': 'America/Sao_Paulo',
      },
    };
  }

  // ========== CONNECTION VALIDATION ==========

  public async validateConnection(integration: IntegrationDocument): Promise<boolean> {
    try {
      const request: UserSearchRequest = {
        quantidade: 1,
      };

      const response = await this.listUsers(integration, request);
      return response?.sucesso === true;
    } catch (error) {
      this.logger.error(`ProdoctorApiService.validateConnection error: ${error.message}`);
      return false;
    }
  }

  // ========== USERS (DOCTORS) ==========

  public async listUsers(integration: IntegrationDocument, request: UserSearchRequest): Promise<UserBasicListResponse> {
    const methodName = 'listUsers';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Usuarios');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<UserBasicListResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listUsersWithSpeciality(
    integration: IntegrationDocument,
    request: UserSearchRequest,
  ): Promise<UserWithSpecialityListResponse> {
    const methodName = 'listUsersWithSpeciality';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Usuarios');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<UserWithSpecialityListResponse>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getUserDetails(integration: IntegrationDocument, userCode: number): Promise<UserDetailsResponse> {
    const methodName = 'getUserDetails';
    this.debugRequest(integration, { userCode });
    this.dispatchAuditEvent(integration, { userCode }, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Usuarios/Detalhar/${userCode}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.get<UserDetailsResponse>(apiUrl, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { userCode }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== LOCATIONS (ORGANIZATION UNITS) ==========

  public async listLocations(
    integration: IntegrationDocument,
    request: LocationSearchRequest,
  ): Promise<LocationListResponse> {
    const methodName = 'listLocations';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/LocaisProDoctor');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<LocationListResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== INSURANCES ==========

  public async listInsurances(
    integration: IntegrationDocument,
    request: InsuranceSearchRequest,
  ): Promise<InsuranceListResponse> {
    const methodName = 'listInsurances';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Convenios');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<InsuranceListResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsuranceDetails(
    integration: IntegrationDocument,
    insuranceCode: number,
  ): Promise<InsuranceDetailsResponse> {
    const methodName = 'getInsuranceDetails';
    this.debugRequest(integration, { insuranceCode });
    this.dispatchAuditEvent(integration, { insuranceCode }, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Convenios/Detalhar/${insuranceCode}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.get<InsuranceDetailsResponse>(apiUrl, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { insuranceCode }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== PROCEDURES ==========

  public async listProcedures(
    integration: IntegrationDocument,
    request: ProcedureSearchRequest,
  ): Promise<ProcedureListResponse> {
    const methodName = 'listProcedures';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Procedimentos');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<ProcedureListResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedureDetails(
    integration: IntegrationDocument,
    tableCode: number,
    procedureCode: string,
  ): Promise<ProcedureDetailsResponse> {
    const methodName = 'getProcedureDetails';
    const params = { tableCode, procedureCode };
    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Procedimentos/Detalhar/${tableCode}/${procedureCode}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.get<ProcedureDetailsResponse>(apiUrl, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProcedureTables(
    integration: IntegrationDocument,
    request: ProcedureTableSearchRequest,
  ): Promise<ProcedureTableListResponse> {
    const methodName = 'listProcedureTables';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/TabelasProcedimentos');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<ProcedureTableListResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== PATIENTS ==========

  public async searchPatients(
    integration: IntegrationDocument,
    request: PatientSearchRequest,
  ): Promise<PatientListResponse> {
    const methodName = 'searchPatients';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Pacientes');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<PatientListResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        return {
          payload: { pacientes: [] },
          sucesso: false,
          mensagens: ['Paciente não encontrado'],
        };
      }
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientDetails(
    integration: IntegrationDocument,
    patientCode: number,
  ): Promise<PatientDetailsResponse> {
    const methodName = 'getPatientDetails';
    this.debugRequest(integration, { patientCode });
    this.dispatchAuditEvent(integration, { patientCode }, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Pacientes/Detalhar/${patientCode}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.get<PatientDetailsResponse>(apiUrl, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { patientCode }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    request: PatientCrudRequest,
  ): Promise<PatientBasicResponse> {
    const methodName = 'createPatient';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Pacientes/Inserir');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<PatientBasicResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);

      if (
        error?.response?.status === HttpStatus.CONFLICT ||
        error?.response?.data?.mensagens?.some((m: string) => m?.includes('já existe'))
      ) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          {
            message: 'Patient already registered with this CPF',
            cpf: request.paciente?.cpf,
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    request: PatientCrudRequest,
  ): Promise<PatientBasicResponse> {
    const methodName = 'updatePatient';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    if (!request.paciente?.codigo) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        {
          message: 'Patient code is required for update',
        },
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Pacientes/Alterar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.put<PatientBasicResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== APPOINTMENTS ==========

  public async listAppointmentsByUser(
    integration: IntegrationDocument,
    request: ListAppointmentsByUserRequest,
  ): Promise<DayScheduleResponse> {
    const methodName = 'listAppointmentsByUser';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Listar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<DayScheduleResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async searchPatientAppointments(
    integration: IntegrationDocument,
    request: SearchPatientAppointmentsRequest,
  ): Promise<AppointmentsListResponse> {
    const methodName = 'searchPatientAppointments';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Buscar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<AppointmentsListResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAppointmentDetails(
    integration: IntegrationDocument,
    appointmentCode: number,
  ): Promise<AppointmentDetailsResponse> {
    const methodName = 'getAppointmentDetails';
    this.debugRequest(integration, { appointmentCode });
    this.dispatchAuditEvent(integration, { appointmentCode }, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Agenda/Detalhar/${appointmentCode}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.get<AppointmentDetailsResponse>(apiUrl, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { appointmentCode }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async insertAppointment(
    integration: IntegrationDocument,
    request: InsertAppointmentRequest,
  ): Promise<InsertedAppointmentResponse> {
    const methodName = 'insertAppointment';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Inserir');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<InsertedAppointmentResponse>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updateAppointment(
    integration: IntegrationDocument,
    request: UpdateAppointmentRequest,
  ): Promise<InsertedAppointmentResponse> {
    const methodName = 'updateAppointment';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Alterar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.put<InsertedAppointmentResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelAppointment(
    integration: IntegrationDocument,
    request: CancelAppointmentRequest,
  ): Promise<AppointmentOperationResponse> {
    const methodName = 'cancelAppointment';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Desmarcar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.patch<AppointmentOperationResponse>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updateAppointmentState(
    integration: IntegrationDocument,
    request: UpdateAppointmentStateRequest,
  ): Promise<UpdateAppointmentStateResponse> {
    const methodName = 'updateAppointmentState';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/AlterarEstado');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.patch<UpdateAppointmentStateResponse>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async searchAppointmentsByStatus(
    integration: IntegrationDocument,
    request: SearchAppointmentsByStatusRequest,
  ): Promise<AppointmentsByStatusResponse> {
    const methodName = 'searchAppointmentsByStatus';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/BuscarPorStatus');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<AppointmentsByStatusResponse>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAvailableTimes(
    integration: IntegrationDocument,
    request: AvailableTimesRequest,
  ): Promise<AvailableTimesResponse> {
    const methodName = 'getAvailableTimes';
    this.debugRequest(integration, request);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/HorariosDisponiveis');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.post<AvailableTimesResponse>(apiUrl, request, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
