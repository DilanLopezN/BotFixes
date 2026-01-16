import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import * as Sentry from '@sentry/node';
import {
  OrganizationUnitsResponse,
  InsurancesResponse,
  InsurancesParamsRequest,
  ProceduresParamsRequest,
  ProceduresResponse,
  TdsaPatientAppointment,
  TdsaGetPatient,
  TdsaCreatedPatient,
  TdsaUpdatePatient,
  SpecialitiesResponse,
  SpecialitiesParamsRequest,
  InsurancePlansParamsRequest,
  InsurancePlansResponse,
  DoctorsResponse,
  DoctorsParamsRequest,
  TdsaListSchedulesParamsRequest,
  TdsaSchedule,
  TdsaGuidance,
} from '../../../integrations/tdsa-integration/interfaces';
import { lastValueFrom } from 'rxjs';
import {
  TdsaAppointmentValueRequest,
  TdsaCreateScheduleRequest,
  TdsaListAvailableSchedulesRequest,
  TdsaListAvailableSchedules,
  TdsaLockScheduleRequest,
} from '../../../integrations/tdsa-integration/interfaces';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import * as contextService from 'request-context';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { TdsaCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class TdsaApiService {
  private logger = new Logger(TdsaApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.TDSA).inc();
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

  private handleResponseError(
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

    if (error?.response?.data && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      const metadata = contextService.get('req:default-headers');
      Sentry.captureEvent({
        message: `${castObjectIdToString(integration._id)}:${integration.name}:TDSA-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error?.response, metadata),
      });
    }
  }

  private async getHeaders(integration: IntegrationDocument) {
    const { apiUsername: username, apiPassword: password } =
      await this.credentialsHelper.getConfig<TdsaCredentialsResponse>(integration);

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

  private async getApiUrl(integration: IntegrationDocument, url: string): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<TdsaCredentialsResponse>(integration);
    return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  public async getPatient(integration: IntegrationDocument, cpf?: string, code?: string): Promise<TdsaGetPatient> {
    const methodName = 'getPatient';
    const payload = { CPF: cpf, Id: code };

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    if (!cpf && !code) {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_GATEWAY, 'Invalid patient params');
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post<TdsaGetPatient>(
          await this.getApiUrl(integration, '/PacienteIntegracao/Buscar'),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      if (error?.response?.data?.Message?.includes('não encontrado')) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      this.handleResponseError(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(integration: IntegrationDocument, payload: TdsaCreatedPatient): Promise<number> {
    const methodName = 'createPatient';
    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<number>(await this.getApiUrl(integration, '/PacienteIntegracao/Inserir'), payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, methodName);
      if (error?.response?.status === HttpStatus.AMBIGUOUS) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          {
            message: 'User already exists',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      } else if (error?.response?.status === HttpStatus.BAD_REQUEST) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error.response.data, HttpErrorOrigin.INTEGRATION_ERROR);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updatePatient(integration: IntegrationDocument, payload: TdsaUpdatePatient): Promise<number> {
    const methodName = 'updatePatient';
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);
    this.debugRequest(integration, payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post<number>(await this.getApiUrl(integration, '/PacienteIntegracao/Alterar'), payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'updatePatient');
      if (error?.response?.status === HttpStatus.BAD_REQUEST) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, error.response.data, HttpErrorOrigin.INTEGRATION_ERROR);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getOrganizationUnits(
    integration: IntegrationDocument,
    ignoreException?: boolean,
  ): Promise<OrganizationUnitsResponse[]> {
    this.debugRequest(integration, {});

    const methodName = 'getOrganizationUnits';
    this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<OrganizationUnitsResponse[]>(
          await this.getApiUrl(integration, '/EmpresaIntegracao/PesquisarUnidadesConsulta'),
          {},
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, methodName, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurances(
    integration: IntegrationDocument,
    body?: InsurancesParamsRequest,
  ): Promise<InsurancesResponse[]> {
    this.debugRequest(integration, body ?? {});

    const methodName = 'getInsurances';
    this.dispatchAuditEvent(integration, body ?? {}, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<InsurancesResponse[]>(
          await this.getApiUrl(integration, '/ConvenioIntegracao/Pesquisar'),
          body ?? {},
          { ...(await this.getHeaders(integration)) },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, body, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getDoctors(integration: IntegrationDocument, body?: DoctorsParamsRequest): Promise<DoctorsResponse[]> {
    this.debugRequest(integration, body ?? {});

    const methodName = 'getDoctors';
    this.dispatchAuditEvent(integration, body ?? {}, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<DoctorsResponse[]>(
          await this.getApiUrl(integration, '/ProfissionalIntegracao/Pesquisar'),
          body ?? {},
          { ...(await this.getHeaders(integration)) },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, body, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedures(
    integration: IntegrationDocument,
    body?: ProceduresParamsRequest,
  ): Promise<ProceduresResponse[]> {
    this.debugRequest(integration, body ?? {});

    const methodName = 'getProcedures';
    this.dispatchAuditEvent(integration, body ?? {}, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<ProceduresResponse[]>(
          await this.getApiUrl(integration, '/ProcedimentoIntegracao/PesquisarProcedimentos'),
          body ?? {},
          { ...(await this.getHeaders(integration)) },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, body, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getSpecialities(
    integration: IntegrationDocument,
    body?: SpecialitiesParamsRequest,
  ): Promise<SpecialitiesResponse[]> {
    this.debugRequest(integration, body ?? {});

    const methodName = 'getSpecialities';
    this.dispatchAuditEvent(integration, body, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<SpecialitiesResponse[]>(
          await this.getApiUrl(integration, '/EspecialidadeIntegracao/Pesquisar'),
          body,
          { ...(await this.getHeaders(integration)) },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, body, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurancePlans(
    integration: IntegrationDocument,
    body?: InsurancePlansParamsRequest,
  ): Promise<InsurancePlansResponse[]> {
    this.debugRequest(integration, body ?? {});

    const methodName = 'getInsurancePlans';
    this.dispatchAuditEvent(integration, body ?? {}, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<InsurancePlansResponse[]>(
          await this.getApiUrl(integration, '/PlanoIntegracao/Pesquisar'),
          body ?? {},
          { ...(await this.getHeaders(integration)) },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, body, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAppointmentValue(
    integration: IntegrationDocument,
    body: TdsaAppointmentValueRequest,
  ): Promise<string> {
    this.debugRequest(integration, body ?? {});

    const methodName = 'getAppointmentValue';
    this.dispatchAuditEvent(integration, body, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<string>(
          await this.getApiUrl(integration, '/ProcedimentoIntegracao/ValorProcedimento'),
          body,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, body, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientCode: string,
  ): Promise<TdsaPatientAppointment[]> {
    this.debugRequest(integration, { patientCode });

    const methodName = 'getPatientSchedules';
    this.dispatchAuditEvent(integration, { patientCode }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<TdsaPatientAppointment[]>(
          await this.getApiUrl(integration, '/AgendamentoIntegracao/BuscaAgendamentoPaciente'),
          patientCode,
          {
            ...(await this.getHeaders(integration)),
            // adicionado pq o body da request é string e não json
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, { patientCode }, 'getPatientAppointments');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(integration: IntegrationDocument, payload: TdsaCreateScheduleRequest): Promise<number> {
    const methodName = 'createSchedule';
    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<number>(await this.getApiUrl(integration, '/AgendamentoIntegracao/Agendar'), payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      if (error?.response?.Message?.includes('Este horário acabou de ser ocupado')) {
        throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Conflict', HttpErrorOrigin.INTEGRATION_ERROR);
      }

      this.handleResponseError(integration, error, payload, 'createSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelSchedule(integration: IntegrationDocument, scheduleId: number): Promise<number> {
    this.debugRequest(integration, { scheduleId });

    const methodName = 'cancelSchedule';
    this.dispatchAuditEvent(integration, { scheduleId }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<number>(
          await this.getApiUrl(integration, '/AgendamentoIntegracao/Cancelar'),
          scheduleId,
          {
            ...(await this.getHeaders(integration)),
            // adicionado pq o body da request é string e não json
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, { scheduleId }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async confirmSchedule(integration: IntegrationDocument, scheduleId: number): Promise<number> {
    this.debugRequest(integration, { scheduleId });

    const methodName = 'confirmSchedule';
    this.dispatchAuditEvent(integration, { scheduleId }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<number>(
          await this.getApiUrl(integration, '/AgendamentoIntegracao/Confirmar'),
          scheduleId,
          {
            ...(await this.getHeaders(integration)),
            // adicionado pq o body da request é string e não json
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, { scheduleId }, 'confirmSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    payload: TdsaListAvailableSchedulesRequest,
  ): Promise<TdsaListAvailableSchedules[]> {
    this.debugRequest(integration, payload);

    const methodName = 'listAvailableSchedules';
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<{ Obj: TdsaListAvailableSchedules[] }>(
          await this.getApiUrl(integration, '/AgendamentoIntegracao/ConsultarHorariosDisponiveis'),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data?.Obj ?? [];
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getAvailableSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async lockSchedule(integration: IntegrationDocument, payload: TdsaLockScheduleRequest): Promise<number> {
    this.debugRequest(integration, payload);

    const methodName = 'lockSchedule';
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<number>(
          await this.getApiUrl(integration, '/AgendamentoIntegracao/BloquearHorario'),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      if (error?.response?.Message?.includes('Este horário acabou de ser ocupado')) {
        throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Conflict', HttpErrorOrigin.INTEGRATION_ERROR);
      }

      this.handleResponseError(integration, error, payload, 'lockSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async unLockSchedule(integration: IntegrationDocument, scheduleId: number): Promise<number> {
    this.debugRequest(integration, { scheduleId });

    const methodName = 'unLockSchedule';
    this.dispatchAuditEvent(integration, { scheduleId }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<number>(
          await this.getApiUrl(integration, '/AgendamentoIntegracao/LiberarHorario'),
          scheduleId,
          {
            ...(await this.getHeaders(integration)),
            // adicionado pq o body da request é string e não json
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, { scheduleId }, 'unLockSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSchedules(
    integration: IntegrationDocument,
    payload: TdsaListSchedulesParamsRequest,
  ): Promise<TdsaSchedule[]> {
    this.debugRequest(integration, payload);

    const methodName = 'listSchedules';
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<TdsaSchedule[]>(
          await this.getApiUrl(integration, '/AgendamentoIntegracao/BuscaAgendamento'),
          payload,
          await this.getHeaders(integration),
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, { payload }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getGuidance(integration: IntegrationDocument, procedureCode: string): Promise<TdsaGuidance> {
    this.debugRequest(integration, { procedureCode });

    const methodName = 'getGuidance';
    this.dispatchAuditEvent(integration, { procedureCode }, methodName, AuditDataType.externalRequest);

    try {
      const auth = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<TdsaGuidance>(
          await this.getApiUrl(integration, '/chatbot/OrientacoesProcedimento'),
          JSON.stringify(procedureCode),
          {
            headers: {
              'Content-Type': 'application/json',
            },
            ...auth,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, { procedureCode }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
