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
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { ProdoctorCredentialsResponse } from '../interfaces/credentials.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

import {
  PDResponseBasicUsuarioViewModel,
  PDResponseUsuarioComEspecialidadeViewModel,
  PDResponseUsuarioViewModel,
  PDResponseLocalProdoctorBasicoViewModel,
  PDResponseConvenioBasicViewModel,
  PDResponseConvenioViewModel,
  PDResponseProcedimentoBasicMedicoViewModel,
  PDResponseProcedimentoMedicoViewModel,
  PDResponseTabelaProcedimentoViewModel,
  UsuarioListarRequest,
  LocalProdoctorListarRequest,
  ConvenioListarRequest,
  ProcedimentoListarRequest,
  TabelaProcedimentoListarRequest,
} from '../interfaces/base.interface';

import {
  PacienteBuscarRequest,
  PacienteCRUDRequest,
  PacienteListarRequest,
  PDResponsePacienteSearchViewModel,
  PDResponsePacienteBasicViewModel,
  PDResponsePacienteViewModel,
  PDResponsePacienteListaViewModel,
} from '../interfaces/patient.interface';

import {
  AgendamentoListarPorUsuarioRequest,
  AgendamentoBuscarRequest,
  AgendamentoInserirRequest,
  AgendamentoAlterarRequest,
  AgendamentoDesmarcarRequest,
  AgendamentoAlterarStatusRequest,
  AgendamentoPorStatusRequest,
  HorariosDisponiveisRequest,
  PDResponseDiaAgendaConsultaViewModel,
  PDResponseAgendamentosViewModel,
  PDResponseAgendamentoDetalhadoViewModel,
  PDResponseAgendamentoInseridoViewModel,
  PDResponseAgendamentoOperacaoViewModel,
  PDResponseHorariosDisponiveisViewModel,
  PDResponseAgendaBuscarPorStatusViewModel,
  PDResponseAlterarStatusAgendamentoViewModel,
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

  // ========== MÉTODOS PRIVADOS DE INFRAESTRUTURA ==========

  private debugRequest(integration: IntegrationDocument, payload: any, methodName?: string) {
    if (!integration.debug) {
      return;
    }

    this.logger.debug(
      `${integration._id}:${integration.name}:${IntegrationType.PRODOCTOR}-debug:${methodName}`,
      payload,
    );
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

  private handleResponseError(
    integration: IntegrationDocument,
    error: any,
    payload: any,
    from: string,
    ignoreException = false,
  ): void {
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
        message: `${integration._id}:${integration.name}:${IntegrationType.PRODOCTOR}-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private async getApiUrl(integration: IntegrationDocument, endpoint: string): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<ProdoctorCredentialsResponse>(integration);
    const baseUrl = apiUrl || 'https://api.prodoctor.net';
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

  // ========== VALIDAÇÃO ==========

  public async validateConnection(integration: IntegrationDocument): Promise<boolean> {
    try {
      const request: UsuarioListarRequest = {
        quantidade: 1,
      };

      const response = await this.listUsuarios(integration, request);
      return response?.sucesso === true;
    } catch (error) {
      this.logger.error(`ProdoctorApiService.validateConnection error: ${error.message}`);
      return false;
    }
  }

  // ========== USUÁRIOS (MÉDICOS) ==========

  public async listUsuarios(
    integration: IntegrationDocument,
    request: UsuarioListarRequest,
  ): Promise<PDResponseBasicUsuarioViewModel> {
    const funcName = this.listUsuarios.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Usuarios');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseBasicUsuarioViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listUsuariosComEspecialidade(
    integration: IntegrationDocument,
    request: UsuarioListarRequest,
  ): Promise<PDResponseUsuarioComEspecialidadeViewModel> {
    const funcName = this.listUsuariosComEspecialidade.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Usuarios');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseUsuarioComEspecialidadeViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async detalharUsuario(integration: IntegrationDocument, codigo: number): Promise<PDResponseUsuarioViewModel> {
    const funcName = this.detalharUsuario.name;
    this.debugRequest(integration, { codigo }, funcName);
    this.dispatchAuditEvent(integration, { codigo }, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Usuarios/Detalhar/${codigo}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.get<PDResponseUsuarioViewModel>(apiUrl, headers));

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { codigo }, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== LOCAIS PRODOCTOR (UNIDADES) ==========

  public async listLocaisProDoctor(
    integration: IntegrationDocument,
    request: LocalProdoctorListarRequest,
  ): Promise<PDResponseLocalProdoctorBasicoViewModel> {
    const funcName = this.listLocaisProDoctor.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/LocaisProDoctor');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseLocalProdoctorBasicoViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== CONVÊNIOS ==========

  public async listConvenios(
    integration: IntegrationDocument,
    request: ConvenioListarRequest,
  ): Promise<PDResponseConvenioBasicViewModel> {
    const funcName = this.listConvenios.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Convenios');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseConvenioBasicViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async detalharConvenio(
    integration: IntegrationDocument,
    codigo: number,
  ): Promise<PDResponseConvenioViewModel> {
    const funcName = this.detalharConvenio.name;
    this.debugRequest(integration, { codigo }, funcName);
    this.dispatchAuditEvent(integration, { codigo }, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Convenios/Detalhar/${codigo}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.get<PDResponseConvenioViewModel>(apiUrl, headers));

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { codigo }, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== PROCEDIMENTOS ==========

  public async listProcedimentos(
    integration: IntegrationDocument,
    request: ProcedimentoListarRequest,
  ): Promise<PDResponseProcedimentoBasicMedicoViewModel> {
    const funcName = this.listProcedimentos.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Procedimentos');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseProcedimentoBasicMedicoViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async detalharProcedimento(
    integration: IntegrationDocument,
    tabela: number,
    codigo: string,
  ): Promise<PDResponseProcedimentoMedicoViewModel> {
    const funcName = this.detalharProcedimento.name;
    const params = { tabela, codigo };
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Procedimentos/Detalhar/${tabela}/${codigo}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.get<PDResponseProcedimentoMedicoViewModel>(apiUrl, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== TABELAS DE PROCEDIMENTOS ==========

  public async listTabelasProcedimentos(
    integration: IntegrationDocument,
    request: TabelaProcedimentoListarRequest,
  ): Promise<PDResponseTabelaProcedimentoViewModel> {
    const funcName = this.listTabelasProcedimentos.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/TabelasProcedimentos');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseTabelaProcedimentoViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== PACIENTES ==========

  public async searchPatient(
    integration: IntegrationDocument,
    request: PacienteBuscarRequest,
  ): Promise<PDResponsePacienteSearchViewModel> {
    const funcName = this.searchPatient.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Pacientes');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponsePacienteSearchViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        return {
          payload: { paciente: {} },
          sucesso: false,
          mensagens: ['Paciente não encontrado'],
        };
      }
      this.handleResponseError(integration, error, request, funcName);
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
  ): Promise<PDResponsePacienteSearchViewModel> {
    const request: PacienteBuscarRequest = {
      cpf: cpf.replace(/\D/g, ''),
    };

    return await this.searchPatient(integration, request);
  }

  public async getPatientDetails(
    integration: IntegrationDocument,
    patientCode: number,
  ): Promise<PDResponsePacienteViewModel> {
    const funcName = this.getPatientDetails.name;
    this.debugRequest(integration, { patientCode }, funcName);
    this.dispatchAuditEvent(integration, { patientCode }, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, `/api/v1/Pacientes/Detalhar/${patientCode}`);
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(this.httpService.get<PDResponsePacienteViewModel>(apiUrl, headers));

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { patientCode }, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    request: PacienteCRUDRequest,
  ): Promise<PDResponsePacienteBasicViewModel> {
    const funcName = this.createPatient.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Pacientes/Inserir');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponsePacienteBasicViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);

      if (
        error?.response?.status === HttpStatus.CONFLICT ||
        error?.response?.data?.mensagens?.some((m: string) => m?.includes('já existe'))
      ) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          {
            message: 'Paciente já cadastrado com este CPF',
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
    request: PacienteCRUDRequest,
  ): Promise<PDResponsePacienteBasicViewModel> {
    const funcName = this.updatePatient.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    if (!request.paciente?.codigo) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        {
          message: 'Código do paciente é obrigatório para atualização',
        },
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Pacientes/Alterar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.put<PDResponsePacienteBasicViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPacientes(
    integration: IntegrationDocument,
    request: PacienteListarRequest,
  ): Promise<PDResponsePacienteListaViewModel> {
    const funcName = this.listPacientes.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Pacientes');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponsePacienteListaViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== AGENDAMENTOS ==========

  public async listarAgendamentos(
    integration: IntegrationDocument,
    request: AgendamentoListarPorUsuarioRequest,
  ): Promise<PDResponseDiaAgendaConsultaViewModel> {
    const funcName = this.listarAgendamentos.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Listar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseDiaAgendaConsultaViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async buscarAgendamentosPaciente(
    integration: IntegrationDocument,
    request: AgendamentoBuscarRequest,
  ): Promise<PDResponseAgendamentosViewModel> {
    const funcName = this.buscarAgendamentosPaciente.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Buscar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseAgendamentosViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async buscarHorariosLivres(
    integration: IntegrationDocument,
    request: HorariosDisponiveisRequest,
  ): Promise<PDResponseHorariosDisponiveisViewModel> {
    const funcName = this.buscarHorariosLivres.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Livres');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseHorariosDisponiveisViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async detalharAgendamento(
    integration: IntegrationDocument,
    request: { codigo: number },
  ): Promise<PDResponseAgendamentoDetalhadoViewModel> {
    const funcName = this.detalharAgendamento.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Detalhar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseAgendamentoDetalhadoViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async inserirAgendamento(
    integration: IntegrationDocument,
    request: AgendamentoInserirRequest,
  ): Promise<PDResponseAgendamentoInseridoViewModel> {
    const funcName = this.inserirAgendamento.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Inserir');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseAgendamentoInseridoViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async alterarAgendamento(
    integration: IntegrationDocument,
    request: AgendamentoAlterarRequest,
  ): Promise<PDResponseAgendamentoInseridoViewModel> {
    const funcName = this.alterarAgendamento.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Alterar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.put<PDResponseAgendamentoInseridoViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async desmarcarAgendamento(
    integration: IntegrationDocument,
    request: AgendamentoDesmarcarRequest,
  ): Promise<PDResponseAgendamentoOperacaoViewModel> {
    const funcName = this.desmarcarAgendamento.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/Desmarcar');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.patch<PDResponseAgendamentoOperacaoViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async alterarStatusAgendamento(
    integration: IntegrationDocument,
    request: AgendamentoAlterarStatusRequest,
  ): Promise<PDResponseAlterarStatusAgendamentoViewModel> {
    const funcName = this.alterarStatusAgendamento.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/AlterarStatus');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.patch<PDResponseAlterarStatusAgendamentoViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async buscarAgendamentosPorStatus(
    integration: IntegrationDocument,
    request: AgendamentoPorStatusRequest,
  ): Promise<PDResponseAgendaBuscarPorStatusViewModel> {
    const funcName = this.buscarAgendamentosPorStatus.name;
    this.debugRequest(integration, request, funcName);
    this.dispatchAuditEvent(integration, request, funcName, AuditDataType.externalRequest);

    try {
      const apiUrl = await this.getApiUrl(integration, '/api/v1/Agenda/BuscarPorStatusTipo');
      const headers = await this.getHeaders(integration);

      const response = await lastValueFrom(
        this.httpService.post<PDResponseAgendaBuscarPorStatusViewModel>(apiUrl, request, headers),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, request, funcName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
