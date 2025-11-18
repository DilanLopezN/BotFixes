import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import * as contextService from 'request-context';
import {
  SICheckPatientExistsRequest,
  SICheckPatientExistsResponse,
  SICreatePatientRequest,
  SICreatePatientResponse,
  SIDoPatientLoginRequest,
  SIDoPatientLoginResponse,
  SIGetPatientByCpfRequest,
  SIGetPatientByCpfResponse,
  SIGetPatientDataRequest,
  SIGetPatientDataResponse,
} from '../interfaces/patient.interface';
import {
  SIAppointmentTypesParamsRequest,
  SIAppointmentTypesResponse,
  SIInsuranceParamsRequest,
  SIInsurancePlansParamsRequest,
  SIInsurancePlansResponse,
  SIInsurancesResponse,
  SIListAllProfessionalsRequest,
  SIListAllProfessionalsResponse,
  SILocalParamsRequest,
  SILocalResponse,
  SILocationsResponse,
  SIProceduresGroupParamsRequest,
  SIProceduresGroupResponse,
  SIProceduresParamsRequest,
  SIProceduresResponse,
  SIProfessionalsExamsParamsRequest,
  SIProfessionalsExamsResponse,
  SIProfessionalsParamsRequest,
  SIProfessionalsResponse,
  SIProfessionalTypesParamsRequest,
  SIProfessionalTypesResponse,
  SISpecialitiesParamsRequest,
  SISpecialitiesResponse,
} from '../interfaces/base-register.interface';
import {
  SICancelScheduleParamsRequest,
  SICreateScheduleExamParamsRequest,
  SICreateScheduleExamResponse,
  SICreateScheduleParamsRequest,
  SICreateScheduleResponse,
  SIListAvailableExamesResponse,
  SiListAvailableExamsParamsRequest,
  SIListAvailableSchedulesParamsRequest,
  SIListAvailableSchedulesResponse,
  SIPatientScheduleDetails,
  SIPatientScheduleDetailsParamsRequest,
  SIPatientSchedulesParamsRequest,
  SIPatientSchedulesResponse,
} from '../interfaces/schedule.interface';
import { SIDefaultRequestParams, SIDefaultRequestResponse } from '../interfaces';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditDataType } from '../../../audit/audit.interface';
import * as moment from 'moment';
import { PATIENT_CACHE_EXPIRATION } from '../../../integration-cache-utils/cache-expirations';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { SuporteInformaticaCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

export interface PatientDataToAuth {
  cpf: string;
  bornDate: string;
  name: string;
  phone: string;
}

@Injectable()
export class SuporteInformaticaApiService {
  private readonly logger = new Logger(SuporteInformaticaApiService.name);
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
          requestsExternalCounter.labels(IntegrationType.SUPORTE_INFORMATICA).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
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

  private async handleResponseError(integration: IntegrationDocument, error: any, payload: any, from: string) {
    this.auditService.sendAuditEvent({
      dataType: AuditDataType.externalResponseError,
      integrationId: castObjectIdToString(integration._id),
      data: {
        data: formatException(error),
      },
      identifier: from,
    });

    if (error?.response?.data) {
      const metadata = contextService.get('req:default-headers');
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:SI-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private async getHeaders(integration: IntegrationDocument) {
    const { apiUsername: username, apiPassword: password } =
      await this.credentialsHelper.getConfig<SuporteInformaticaCredentialsResponse>(integration);

    if (!username || !password) {
      throw HTTP_ERROR_THROWER(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    return {
      auth: {
        username,
        password,
      },
    };
  }

  private async getApiUrl(integration: IntegrationDocument): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<SuporteInformaticaCredentialsResponse>(integration);

    if (!apiUrl) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'invalid api url',
      });
    }

    return apiUrl;
  }

  private async getUserPatientData(
    integration: IntegrationDocument,
    patient: PatientDataToAuth,
    authenticatedRequest?: boolean,
    renewToken?: boolean,
  ): Promise<SIDefaultRequestParams> {
    const { codeIntegration: codeIntegration } =
      await this.credentialsHelper.getConfig<SuporteInformaticaCredentialsResponse>(integration);

    const defaultPayload: SIDefaultRequestParams = {
      CodCanalAOL: 10,
      CodClienteOrigem: Number(codeIntegration),
    };

    if (!authenticatedRequest) {
      return defaultPayload;
    }

    const patientToken = await this.integrationCacheUtilsService.getPatientTokenFromCache(integration, patient.cpf);

    if (!patientToken && (!patient?.cpf || !patient?.bornDate || !patient?.name)) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        'Cannot authenticate patient',
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    if (!patientToken || renewToken) {
      const dateFormat = 'YYYY-MM-DD HH:mm:ss';

      let patientData;
      if (!patient.phone) {
        patientData = await this.getPatientByCpf(integration, {
          DataNascimento: moment(patient.bornDate).format(dateFormat),
          CPF: patient.cpf,
          NomePessoa: '',
          Telefone: '',
          NomeMae: '',
        });
      }

      const response = await this.doPatientLogin(integration, {
        CPF: patient.cpf,
        DataNascimento: moment(patient.bornDate).format(dateFormat),
        Nome: patient.name?.trim(),
        Telefone: String(patient.phone || patientData?.TelefoneCelular),
        TipoLogin: 1,
        PrimeiroNome: patient.name?.trim().split(' ')?.[0],
        UltimoNome: '',
        Carteira: '',
      });

      if (response?.Token) {
        await this.integrationCacheUtilsService.setPatientTokenCache(
          integration,
          patient.cpf,
          response.Token,
          PATIENT_CACHE_EXPIRATION,
        );

        defaultPayload.Token = response.Token;
      } else {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          'Cannot authenticate default user',
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }
    }

    if (patientToken) {
      defaultPayload.Token = patientToken;
    }

    return defaultPayload;
  }

  private debugRequest(integration: IntegrationDocument, payload: Record<string, unknown>) {
    if (!integration.debug) {
      return;
    }

    const payloadCopy = { ...payload };

    if (payloadCopy?.Token) {
      delete payloadCopy.Token;
    }

    this.logger.debug(`${integration._id}:${integration.name}:SI-debug`, payloadCopy);
  }

  public async doPatientLogin(
    integration: IntegrationDocument,
    data: SIDoPatientLoginRequest,
  ): Promise<SIDoPatientLoginResponse> {
    const methodName = 'doPatientLogin';
    const defaultData = await this.getUserPatientData(integration, undefined, false);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIDoPatientLoginResponse>(`${apiUrl}/api/webApiAOL/AATEfetuaLogin`, payload, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async checkPatientExists(
    integration: IntegrationDocument,
    data: SICheckPatientExistsRequest,
  ): Promise<SICheckPatientExistsResponse> {
    const methodName = 'checkPatientExists';
    const defaultData = await this.getUserPatientData(integration, undefined, false);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SICheckPatientExistsResponse>(
          `${apiUrl}/api/webApiAOL/AATBuscaQuantidadePessoas`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    data: SICreatePatientRequest,
  ): Promise<SICreatePatientResponse> {
    const methodName = 'createPatient';
    const defaultData = await this.getUserPatientData(integration, undefined, false);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SICreatePatientResponse>(
          `${apiUrl}/api/webApiAOL/AATcadastraPessoaEfetuaLogin`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientData(
    integration: IntegrationDocument,
    data: SIGetPatientDataRequest,
    patient: PatientDataToAuth,
  ): Promise<SIGetPatientDataResponse> {
    const methodName = 'getPatientData';
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIGetPatientDataResponse>(`${apiUrl}/api/webApiAOL/BuscaDadosPessoa`, payload, headers),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    data: SIInsuranceParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIInsurancesResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIInsurancesResponse>(`${apiUrl}/api/webApiAOL/buscaConvenios`, payload, headers),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listInsurances');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    data: SIInsurancePlansParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIInsurancePlansResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIInsurancePlansResponse>(
          `${apiUrl}/api/webApiAOL/buscaPlanosConvenio`,
          payload,
          headers,
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listInsurancePlans');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAppointmentTypes(
    integration: IntegrationDocument,
    data: SIAppointmentTypesParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIAppointmentTypesResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIAppointmentTypesResponse>(
          `${apiUrl}/api/webApiAOL/buscaTiposAtendimento`,
          payload,
          headers,
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listAppointmentTypes');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProfessionalTypes(
    integration: IntegrationDocument,
    data: SIProfessionalTypesParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIProfessionalTypesResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIProfessionalTypesResponse>(
          `${apiUrl}/api/webApiAOL/BuscaTiposProfissional`,
          payload,
          headers,
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listProfessionalTypes');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    data: SISpecialitiesParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SISpecialitiesResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SISpecialitiesResponse>(`${apiUrl}/api/webApiAOL/buscaEspecialidades`, payload, headers),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listSpecialities');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getLocal(
    integration: IntegrationDocument,
    data: SILocalParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SILocalResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SILocalResponse>(`${apiUrl}/api/Local/BuscaPorId`, payload, headers),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'getLocal');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listLocations(
    integration: IntegrationDocument,
    patient: PatientDataToAuth,
  ): Promise<SILocationsResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SILocationsResponse>(`${apiUrl}/api/Local/BuscaLocaisClienteOrigem`, payload, headers),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'listLocations');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProfessionals(
    integration: IntegrationDocument,
    data: SIProfessionalsParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIProfessionalsResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIProfessionalsResponse>(
          `${apiUrl}/api/webApiAOL/ExecutaPesquisaProfissionais`,
          payload,
          headers,
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listProfessionals');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProfessionalsExams(
    integration: IntegrationDocument,
    data: SIProfessionalsExamsParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIProfessionalsExamsResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIProfessionalsExamsResponse>(
          `${apiUrl}/api/webApiAOL/PesquisaBuscaProfissionaisLocaisProcedimentos`,
          payload,
          headers,
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listProfessionalsExams');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableSchedules(
    integration: IntegrationDocument,
    data: SIListAvailableSchedulesParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIListAvailableSchedulesResponse> {
    const methodName = 'listAvailableSchedules';
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIListAvailableSchedulesResponse>(
          `${apiUrl}/api/webApiAOL/AATExecutaPesquisaHorarios`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPatientSchedules(
    integration: IntegrationDocument,
    data: SIPatientSchedulesParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIPatientSchedulesResponse> {
    const methodName = 'listPatientSchedules';
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIPatientSchedulesResponse>(
          `${apiUrl}/api/webApiAOL/buscaListaAgendamentos`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPatientScheduleDetails(
    integration: IntegrationDocument,
    data: SIPatientScheduleDetailsParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIPatientScheduleDetails> {
    const methodName = 'listPatientScheduleDetails';
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIPatientScheduleDetails>(
          `${apiUrl}/api/webApiAOL/buscaDetalhesAgendamento`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    data: SICreateScheduleParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SICreateScheduleResponse> {
    const methodName = 'createSchedule';
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SICreateScheduleResponse>(
          `${apiUrl}/api/webApiAOL/ConfirmaReservaAgendamento`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelSchedule(
    integration: IntegrationDocument,
    data: SICancelScheduleParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIDefaultRequestResponse> {
    const methodName = 'cancelSchedule';
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIDefaultRequestResponse>(
          `${apiUrl}/api/webApiAOL/DesmarcarAgendamento`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableExams(
    integration: IntegrationDocument,
    data: SiListAvailableExamsParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIListAvailableExamesResponse> {
    const methodName = 'listAvailableExams';
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIListAvailableExamesResponse>(
          `${apiUrl}/api/webApiAOL/ExecutaPesquisaHorariosExames`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createScheduleExam(
    integration: IntegrationDocument,
    data: SICreateScheduleExamParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SICreateScheduleExamResponse> {
    const methodName = 'createScheduleExam';
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SICreateScheduleExamResponse>(
          `${apiUrl}/api/webApiAOL/ConfirmaAgendamentoExames`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listExamProcedures(
    integration: IntegrationDocument,
    data: SIProceduresParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIProceduresResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIProceduresResponse>(
          `${apiUrl}/api/webApiAOL/BuscaProcedimentoPorCodigoENome `,
          payload,
          headers,
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listExamProcedures');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listExamGroupProcedures(
    integration: IntegrationDocument,
    data: SIProceduresGroupParamsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIProceduresGroupResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIProceduresGroupResponse>(
          `${apiUrl}/api/webApiAOL/BuscaGruposSubgruposComProcedimentos `,
          payload,
          headers,
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listExamGroupProcedures');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientByCpf(
    integration: IntegrationDocument,
    data: SIGetPatientByCpfRequest,
  ): Promise<SIGetPatientByCpfResponse> {
    const methodName = 'getPatientByCpf';
    const defaultData = await this.getUserPatientData(integration, undefined, false);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIGetPatientByCpfResponse>(
          `${apiUrl}/api/Autenticacao/EfetuaLoginPorCPF`,
          payload,
          headers,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAllProfessionals(
    integration: IntegrationDocument,
    data: SIListAllProfessionalsRequest,
    patient: PatientDataToAuth,
  ): Promise<SIListAllProfessionalsResponse> {
    const defaultData = await this.getUserPatientData(integration, patient, true);
    const payload = { ...data, ...defaultData };
    const headers = await this.getHeaders(integration);
    const apiUrl = await this.getApiUrl(integration);

    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SIListAllProfessionalsResponse>(
          `${apiUrl}/api/Profissional/BuscaProfissionaisClienteOrigem`,
          payload,
          headers,
        ),
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, 'listAllProfessionals');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
