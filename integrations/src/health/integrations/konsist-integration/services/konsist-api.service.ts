import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import {
  KonsistCredentialsResponse,
  KonsistAgendaRequest,
  KonsistAgendaRetorno,
  KonsistAgendaHorarioRequest,
  KonsistAgendaHorarioRetorno,
  KonsistPeriodoAgendamentoRequest,
  KonsistAgendamentoResponse,
  KonsistPreAgendamentoRequest,
  KonsistProtocoloStatusRequest,
  KonsistProtocoloStatusRetorno,
  KonsistStatusRequest,
  KonsistRetornoAlteracaoStatus,
  KonsistConvenioResponse,
  KonsistEmpresaResponse,
  KonsistMedicoResponse,
  KonsistMedicoAgendamentoRequest,
  KonsistCamposUsuarioRetorno,
  KonsistListarPacienteRequest,
  KonsistDadosPacienteResponse,
  KonsistIncluirPacienteRequest as KonsistCreatePatientRequest,
  KonsistCreatePatientResponse,
} from '../interfaces';

@Injectable()
export class KonsistApiService {
  private logger = new Logger(KonsistApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.KONSIST).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  // ==================== PRIVATE METHODS ====================

  private debugRequest(integration: IntegrationDocument, payload: any, funcName?: string) {
    if (!integration.debug) {
      return;
    }
    this.logger.debug(`${integration._id}:${integration.name}:${IntegrationType.KONSIST}-debug:${funcName}`, payload);
  }

  private handleResponseError(integration: IntegrationDocument, error: any, payload: any, from: string) {
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
        message: `${integration._id}:${integration.name}:${IntegrationType.KONSIST}-request: ${from}`,
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

  private async getHeaders(integration: IntegrationDocument): Promise<{ headers: Record<string, string> }> {
    const { api_key } = await this.credentialsHelper.getConfig<KonsistCredentialsResponse>(integration);

    if (!api_key) {
      throw HTTP_ERROR_THROWER(HttpStatus.UNAUTHORIZED, 'Invalid Konsist credentials');
    }

    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api_key}`,
      },
    };
  }

  // ==================== SCHEDULES ====================

  /**
   * POST /listaragenda - Lista agendamentos de um médico específico
   */
  public async listSchedules(
    integration: IntegrationDocument,
    request: KonsistAgendaRequest,
  ): Promise<KonsistAgendaRetorno[]> {
    const methodName = 'listSchedules';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<KonsistAgendaRetorno[]>('/listaragenda', request, headers),
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

  /**
   * GET /listarmedicoagenda/{emailusuario} - Lista médicos com agenda visível
   */
  public async listDoctorsWithSchedule(
    integration: IntegrationDocument,
    userEmail: string,
  ): Promise<KonsistMedicoResponse[]> {
    const methodName = 'listDoctorsWithSchedule';
    this.debugRequest(integration, { userEmail }, methodName);
    this.dispatchAuditEvent(integration, { userEmail }, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.get<KonsistMedicoResponse[]>(`/listarmedicoagenda/${userEmail}`, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { userEmail }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ==================== APPOINTMENTS ====================

  /**
   * GET /agendamentos/{cpf} - Consulta agendamentos do paciente do dia de hoje
   */
  public async getAppointmentsByCpf(
    integration: IntegrationDocument,
    cpf: string,
  ): Promise<KonsistAgendamentoResponse> {
    const methodName = 'getAppointmentsByCpf';
    this.debugRequest(integration, { cpf }, methodName);
    this.dispatchAuditEvent(integration, { cpf }, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.get<KonsistAgendamentoResponse>(`/agendamentos/${cpf}`, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { cpf }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * POST /agendamentos - Consulta agendamentos dentro de um período
   */
  public async listAppointments(
    integration: IntegrationDocument,
    request: KonsistPeriodoAgendamentoRequest,
  ): Promise<KonsistAgendamentoResponse[]> {
    const methodName = 'listAppointments';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<KonsistAgendamentoResponse[]>('/agendamentos', request, headers),
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

  // ==================== AVAILABLE SCHEDULES ====================

  /**
   * POST /medico/agendamento/disponiveis - Passo 1: Retorna médicos disponíveis
   */
  public async getAvailableDoctors(
    integration: IntegrationDocument,
    request: KonsistMedicoAgendamentoRequest,
  ): Promise<any> {
    const methodName = 'getAvailableDoctors';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<any>('/medico/agendamento/disponiveis', request, headers),
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

  /**
   * POST /medico/agendamento/horarios-disponiveis - Passo 2: Retorna horários disponíveis
   */
  public async getAvailableSchedules(
    integration: IntegrationDocument,
    request: KonsistAgendaHorarioRequest,
  ): Promise<KonsistAgendaHorarioRetorno[]> {
    const methodName = 'getAvailableSchedules';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<KonsistAgendaHorarioRetorno[]>(
          '/medico/agendamento/horarios-disponiveis',
          request,
          headers,
        ),
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

  /**
   * POST /medico/agendamento/marcar - Passo 3: Realiza pré-agendamento
   */
  public async createPreSchedule(
    integration: IntegrationDocument,
    request: KonsistPreAgendamentoRequest,
  ): Promise<{ protocolo: string }> {
    const methodName = 'createPreSchedule';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<{ protocolo: string }>('/medico/agendamento/marcar', request, headers),
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

  /**
   * POST /medico/agendamento/status-protocolo - Passo 4: Retorna status do protocolo
   */
  public async getProtocolStatus(
    integration: IntegrationDocument,
    request: KonsistProtocoloStatusRequest,
  ): Promise<KonsistProtocoloStatusRetorno[]> {
    const methodName = 'getProtocolStatus';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<KonsistProtocoloStatusRetorno[]>(
          '/medico/agendamento/status-protocolo',
          request,
          headers,
        ),
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

  // ==================== STATUS ====================

  /**
   * POST /status - Altera status do agendamento
   */
  public async updateAppointmentStatus(integration: IntegrationDocument, request: KonsistStatusRequest): Promise<any> {
    const methodName = 'updateAppointmentStatus';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.post<any>('/status', request, headers));

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

  /**
   * POST /status-lote - Altera status em lote dos agendamentos
   */
  public async updateAppointmentStatusBatch(
    integration: IntegrationDocument,
    request: KonsistStatusRequest[],
  ): Promise<KonsistRetornoAlteracaoStatus[]> {
    const methodName = 'updateAppointmentStatusBatch';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<KonsistRetornoAlteracaoStatus[]>('/status-lote', request, headers),
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

  // ==================== ORGANIZATION UNITS ====================

  /**
   * GET /cliente - Lista todos os clientes
   */
  public async listClients(integration: IntegrationDocument): Promise<KonsistEmpresaResponse[]> {
    const methodName = 'listClients';
    this.debugRequest(integration, {}, methodName);
    this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<KonsistEmpresaResponse[]>('/cliente', headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, {}, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * GET /cliente/{id} - Lista dados de um cliente específico
   */
  public async getClientById(integration: IntegrationDocument, id: string): Promise<KonsistEmpresaResponse> {
    const methodName = 'getClientById';
    this.debugRequest(integration, { id }, methodName);
    this.dispatchAuditEvent(integration, { id }, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<KonsistEmpresaResponse>(`/cliente/${id}`, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { id }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * GET /clientefilial - Lista todos os locais (filiais)
   */
  public async listOrganizationUnits(integration: IntegrationDocument): Promise<KonsistEmpresaResponse[]> {
    const methodName = 'listOrganizationUnits';
    this.debugRequest(integration, {}, methodName);
    this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<KonsistEmpresaResponse[]>('/clientefilial', headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, {}, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * GET /clientefilial/{id} - Lista dados de uma filial específica
   */
  public async getOrganizationUnitById(integration: IntegrationDocument, id: string): Promise<KonsistEmpresaResponse> {
    const methodName = 'getOrganizationUnitById';
    this.debugRequest(integration, { id }, methodName);
    this.dispatchAuditEvent(integration, { id }, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.get<KonsistEmpresaResponse>(`/clientefilial/${id}`, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { id }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ==================== INSURANCES ====================

  /**
   * GET /listarconvenio - Lista todos os convênios
   */
  public async listInsurances(integration: IntegrationDocument): Promise<KonsistConvenioResponse[]> {
    const methodName = 'listInsurances';
    this.debugRequest(integration, {}, methodName);
    this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<KonsistConvenioResponse[]>('/listarconvenio', headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, {}, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * GET /listarconvenio/{id} - Lista dados de um convênio específico
   */
  public async getInsuranceById(integration: IntegrationDocument, id: string): Promise<KonsistConvenioResponse> {
    const methodName = 'getInsuranceById';
    this.debugRequest(integration, { id }, methodName);
    this.dispatchAuditEvent(integration, { id }, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.get<KonsistConvenioResponse>(`/listarconvenio/${id}`, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { id }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ==================== DOCTORS ====================

  /**
   * GET /listarmedico - Lista todos os médicos ativos com agenda definida
   */
  public async listDoctors(integration: IntegrationDocument): Promise<KonsistMedicoResponse[]> {
    const methodName = 'listDoctors';
    this.debugRequest(integration, {}, methodName);
    this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<KonsistMedicoResponse[]>('/listarmedico', headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, {}, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * GET /listarmedico/{id} - Lista dados de um médico específico
   */
  public async getDoctorById(integration: IntegrationDocument, id: string): Promise<KonsistMedicoResponse> {
    const methodName = 'getDoctorById';
    this.debugRequest(integration, { id }, methodName);
    this.dispatchAuditEvent(integration, { id }, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<KonsistMedicoResponse>(`/listarmedico/${id}`, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { id }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ==================== PATIENTS ====================

  /**
   * POST /listarpaciente - Lista dados pessoais do paciente
   */
  public async listPatients(
    integration: IntegrationDocument,
    request: KonsistListarPacienteRequest,
  ): Promise<KonsistDadosPacienteResponse[]> {
    const methodName = 'listPatients';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<KonsistDadosPacienteResponse[]>('/listarpaciente', request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        return [];
      }
      this.handleResponseError(integration, error, request, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * POST /paciente - Insere dados cadastrais do paciente, interfaces condizentes check
   */
  public async createPatient(
    integration: IntegrationDocument,
    request: KonsistCreatePatientRequest,
  ): Promise<KonsistCreatePatientResponse> {
    const methodName = 'createPatient';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<KonsistCreatePatientResponse>('/paciente', request, headers),
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

  // ==================== PROCEDURES ====================

  /**
   * GET /listarservico - Retorna serviços/procedimentos disponíveis
   */
  public async listProcedures(integration: IntegrationDocument): Promise<any[]> {
    const methodName = 'listProcedures';
    this.debugRequest(integration, {}, methodName);
    this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<any[]>('/listarservico', headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, {}, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * GET /listarservico/{idconvenio} - Retorna serviços para um convênio específico
   */
  public async listProceduresByInsurance(integration: IntegrationDocument, insuranceId: string): Promise<any[]> {
    const methodName = 'listProceduresByInsurance';
    this.debugRequest(integration, { insuranceId }, methodName);
    this.dispatchAuditEvent(integration, { insuranceId }, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<any[]>(`/listarservico/${insuranceId}`, headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { insuranceId }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ==================== USER ====================

  /**
   * GET /dadosusuario/{emailusuario} - Dados pessoais do usuário logado
   */
  public async getUserData(integration: IntegrationDocument, userEmail: string): Promise<KonsistCamposUsuarioRetorno> {
    const methodName = 'getUserData';
    this.debugRequest(integration, { userEmail }, methodName);
    this.dispatchAuditEvent(integration, { userEmail }, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.get<KonsistCamposUsuarioRetorno>(`/dadosusuario/${userEmail}`, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { userEmail }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ==================== SPECIALITIES ====================

  /**
   * GET /listarespecialidade - Lista todas as especialidades disponíveis
   */
  public async listSpecialities(integration: IntegrationDocument): Promise<any[]> {
    const methodName = 'listSpecialities';
    this.debugRequest(integration, {}, methodName);
    this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(this.httpService.get<any[]>('/listarespecialidade', headers));

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data || [];
    } catch (error) {
      this.handleResponseError(integration, error, {}, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ==================== PRE-AGENDAMENTO ====================

  /**
   * POST /medico/agendamento/marcar - Realiza o pré-agendamento
   */
  public async createPreAgendamento(
    integration: IntegrationDocument,
    request: KonsistPreAgendamentoRequest,
  ): Promise<{ protocolo: string }> {
    const methodName = 'createPreAgendamento';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<{ protocolo: string }>('/medico/agendamento/marcar', request, headers),
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

  // ==================== AGENDAMENTOS POR PERÍODO ====================

  /**
   * POST /agendamentos - Consulta agendamentos dentro de um período
   */
  public async getAppointmentsByPeriod(
    integration: IntegrationDocument,
    request: KonsistPeriodoAgendamentoRequest,
  ): Promise<KonsistAgendamentoResponse[]> {
    const methodName = 'getAppointmentsByPeriod';
    this.debugRequest(integration, request, methodName);
    this.dispatchAuditEvent(integration, request, methodName, AuditDataType.externalRequest);

    try {
      const headers = await this.getHeaders(integration);
      const response = await lastValueFrom(
        this.httpService.post<KonsistAgendamentoResponse[]>('/agendamentos', request, headers),
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

  // ==================== VALIDATION ====================

  /**
   * Valida conexão com a API Konsist
   */
  public async validateConnection(integration: IntegrationDocument): Promise<boolean> {
    try {
      const response = await this.listInsurances(integration);
      return Array.isArray(response);
    } catch (error) {
      this.logger.error(`KonsistApiService.validateConnection error: ${error.message}`);
      return false;
    }
  }
}
