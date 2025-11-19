import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditService } from '../../../audit/services/audit.service';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditDataType } from '../../../audit/audit.interface';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { HttpErrorOrigin, HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { formatException } from '../../../../common/helpers/format-exception-audit';

import {
  PDResponse,
  PDResponseBasicUsuarioViewModel,
  PDResponseLocalProdoctorBasicoViewModel,
  PDResponseConvenioBasicViewModel,
  UsuarioListarRequest,
  LocalProdoctorListarRequest,
  ConvenioListarRequest,
  CodigoBaseRequest,
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
  HorariosDisponiveisRequest,
  PDResponseDiaAgendaConsultaViewModel,
  PDResponseAgendamentosViewModel,
  PDResponseAgendamentoDetalhadoViewModel,
  PDResponseAgendamentoInseridoViewModel,
  PDResponseAgendamentoOperacaoViewModel,
  PDResponseHorariosDisponiveisViewModel,
} from '../interfaces/schedule.interface';

interface ProdoctorConfig {
  apiUrl: string;
  apiKey: string;
  apiPassword: string;
  useFakeApi?: boolean;
}

@Injectable()
export class ProdoctorApiService {
  private readonly logger = new Logger(ProdoctorApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly credentialsHelper: CredentialsHelper,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
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

  private debugRequest(integration: IntegrationDocument, payload: any, funcName: string) {
    if (!integration.debug) {
      return;
    }
    this.logger.debug(`${integration._id}:${integration.name}:PRODOCTOR-debug:${funcName}`, payload);
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
        message: `${integration._id}:${integration.name}:PRODOCTOR-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error?.response, metadata),
      });
    }
  }

  private async getConfig(integration: IntegrationDocument): Promise<ProdoctorConfig> {
    return await this.credentialsHelper.getConfig<ProdoctorConfig>(integration);
  }

  private async makeRequest<T>(
    integration: IntegrationDocument,
    method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    params?: any,
  ): Promise<T> {
    const methodName = `${method}.${endpoint}`;

    try {
      const config = await this.getConfig(integration);
      const baseUrl = config.useFakeApi ? 'http://localhost:7575' : config.apiUrl;
      const url = `${baseUrl}${endpoint}`;

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (!config.useFakeApi) {
        headers['X-APIKEY'] = config.apiKey;
        headers['X-APIPASSWORD'] = config.apiPassword;
        headers['X-APITIMEZONE'] = '-03:00';
        headers['X-APITIMEZONENAME'] = 'America/Sao_Paulo';
      }

      const requestConfig = {
        headers,
        params,
      };

      this.debugRequest(integration, { url, method, data, params }, methodName);
      this.dispatchAuditEvent(integration, { data, params }, methodName, AuditDataType.externalRequest);

      let response;

      switch (method) {
        case 'POST':
          response = await lastValueFrom(this.httpService.post(url, data || {}, requestConfig));
          break;
        case 'GET':
          response = await lastValueFrom(this.httpService.get(url, requestConfig));
          break;
        case 'PUT':
          response = await lastValueFrom(this.httpService.put(url, data || {}, requestConfig));
          break;
        case 'DELETE':
          response = await lastValueFrom(this.httpService.delete(url, requestConfig));
          break;
        case 'PATCH':
          response = await lastValueFrom(this.httpService.patch(url, data || {}, requestConfig));
          break;
      }

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, data, methodName);

      const errorMessage = error.response?.data?.mensagens?.[0] || error.response?.data?.message || error.message;
      const errorStatus = error.response?.status || HttpStatus.BAD_REQUEST;

      throw HTTP_ERROR_THROWER(
        errorStatus,
        {
          message: errorMessage,
          endpoint,
          method,
        },
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== VALIDAÇÃO ==========

  async validateConnection(integration: IntegrationDocument): Promise<boolean> {
    try {
      const request: UsuarioListarRequest = {
        quantidade: 1,
      };

      const response = await this.makeRequest<PDResponseBasicUsuarioViewModel>(
        integration,
        'POST',
        '/api/v1/Usuario/Listar',
        request,
      );

      return response.sucesso === true;
    } catch (error) {
      this.logger.error(`ProdoctorApiService.validateConnection error: ${error.message}`);
      return false;
    }
  }

  // ========== USUÁRIOS ==========

  async listUsuarios(
    integration: IntegrationDocument,
    request: UsuarioListarRequest,
  ): Promise<PDResponseBasicUsuarioViewModel> {
    return await this.makeRequest<PDResponseBasicUsuarioViewModel>(
      integration,
      'POST',
      '/api/v1/Usuario/Listar',
      request,
    );
  }

  // ========== LOCAIS PRODOCTOR ==========

  async listLocaisProDoctor(
    integration: IntegrationDocument,
    request: LocalProdoctorListarRequest,
  ): Promise<PDResponseLocalProdoctorBasicoViewModel> {
    return await this.makeRequest<PDResponseLocalProdoctorBasicoViewModel>(
      integration,
      'POST',
      '/api/v1/LocalProDoctor/Listar',
      request,
    );
  }

  // ========== CONVÊNIOS ==========

  async listConvenios(
    integration: IntegrationDocument,
    request: ConvenioListarRequest,
  ): Promise<PDResponseConvenioBasicViewModel> {
    return await this.makeRequest<PDResponseConvenioBasicViewModel>(
      integration,
      'POST',
      '/api/v1/Convenio/Listar',
      request,
    );
  }

  // ========== PACIENTES ==========

  async searchPatient(
    integration: IntegrationDocument,
    request: PacienteBuscarRequest,
  ): Promise<PDResponsePacienteSearchViewModel> {
    try {
      return await this.makeRequest<PDResponsePacienteSearchViewModel>(
        integration,
        'POST',
        '/api/v1/Paciente/Buscar',
        request,
      );
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        return {
          payload: { paciente: null },
          sucesso: false,
          mensagens: ['Paciente não encontrado'],
        };
      }
      throw error;
    }
  }

  async getPatientByCpf(
    integration: IntegrationDocument,
    cpf: string,
    localProDoctorCodigo?: number,
  ): Promise<PDResponsePacienteSearchViewModel> {
    const request: PacienteBuscarRequest = {
      cpf: cpf.replace(/\D/g, ''),
    };

    if (localProDoctorCodigo) {
      request.localProDoctor = { codigo: localProDoctorCodigo };
    }

    return await this.searchPatient(integration, request);
  }

  async getPatientDetails(integration: IntegrationDocument, patientCode: number): Promise<PDResponsePacienteViewModel> {
    try {
      return await this.makeRequest<PDResponsePacienteViewModel>(
        integration,
        'GET',
        `/api/v1/Paciente/Detalhar/${patientCode}`,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.getPatientDetails', error);
    }
  }

  async createPatient(
    integration: IntegrationDocument,
    request: PacienteCRUDRequest,
  ): Promise<PDResponsePacienteSearchViewModel> {
    try {
      return await this.makeRequest<PDResponsePacienteSearchViewModel>(
        integration,
        'POST',
        '/api/v1/Pacientes/Inserir',
        request,
      );
    } catch (error) {
      if (error.status === HttpStatus.CONFLICT || error.message?.includes('já existe')) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          {
            message: 'Paciente já cadastrado com este CPF',
            cpf: request.paciente.cpf,
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.createPatient', error);
    }
  }

  async updatePatient(
    integration: IntegrationDocument,
    request: PacienteCRUDRequest,
  ): Promise<PDResponsePacienteBasicViewModel> {
    try {
      if (!request.paciente.codigo) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.BAD_REQUEST,
          {
            message: 'Código do paciente é obrigatório para atualização',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return await this.makeRequest<PDResponsePacienteBasicViewModel>(
        integration,
        'PUT',
        '/api/v1/Pacientes/Alterar',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.updatePatient', error);
    }
  }

  async listPacientes(
    integration: IntegrationDocument,
    request: PacienteListarRequest,
  ): Promise<PDResponsePacienteListaViewModel> {
    try {
      return await this.makeRequest<PDResponsePacienteListaViewModel>(
        integration,
        'POST',
        '/api/v1/Pacientes',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.listPacientes', error);
    }
  }

  async listAniversariantes(
    integration: IntegrationDocument,
    request: {
      dataInicio: string;
      dataFinal: string;
      locaisProDoctor?: CodigoBaseRequest[];
    },
  ): Promise<PDResponse<{ periodo: any; aniversariantes: any[] }>> {
    try {
      return await this.makeRequest<PDResponse<{ periodo: any; aniversariantes: any[] }>>(
        integration,
        'POST',
        '/api/v1/Pacientes/Aniversariantes',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.listAniversariantes', error);
    }
  }

  // ========== AGENDAMENTOS ==========

  async listAgendamentos(
    integration: IntegrationDocument,
    request: AgendamentoListarPorUsuarioRequest,
  ): Promise<PDResponseDiaAgendaConsultaViewModel> {
    try {
      return await this.makeRequest<PDResponseDiaAgendaConsultaViewModel>(
        integration,
        'POST',
        '/api/v1/Agenda/Listar',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.listAgendamentos', error);
    }
  }

  async searchAgendamentos(
    integration: IntegrationDocument,
    request: AgendamentoBuscarRequest,
  ): Promise<PDResponseAgendamentosViewModel> {
    try {
      return await this.makeRequest<PDResponseAgendamentosViewModel>(
        integration,
        'POST',
        '/api/v1/Agenda/Buscar',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.searchAgendamentos', error);
    }
  }

  async getAgendamentoDetails(
    integration: IntegrationDocument,
    codigo: number,
  ): Promise<PDResponseAgendamentoDetalhadoViewModel> {
    try {
      return await this.makeRequest<PDResponseAgendamentoDetalhadoViewModel>(
        integration,
        'GET',
        `/api/v1/Agenda/Detalhar/${codigo}`,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.getAgendamentoDetails', error);
    }
  }

  async createAgendamento(
    integration: IntegrationDocument,
    request: AgendamentoInserirRequest,
  ): Promise<PDResponseAgendamentoInseridoViewModel> {
    try {
      return await this.makeRequest<PDResponseAgendamentoInseridoViewModel>(
        integration,
        'POST',
        '/api/v1/Agenda/Inserir',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.createAgendamento', error);
    }
  }

  async updateAgendamento(
    integration: IntegrationDocument,
    request: AgendamentoAlterarRequest,
  ): Promise<PDResponseAgendamentoOperacaoViewModel> {
    try {
      return await this.makeRequest<PDResponseAgendamentoOperacaoViewModel>(
        integration,
        'PUT',
        '/api/v1/Agenda/Alterar',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.updateAgendamento', error);
    }
  }

  async cancelAgendamento(
    integration: IntegrationDocument,
    codigo: number,
    motivo?: string,
  ): Promise<PDResponseAgendamentoOperacaoViewModel> {
    try {
      const params = motivo ? { motivo } : undefined;
      return await this.makeRequest<PDResponseAgendamentoOperacaoViewModel>(
        integration,
        'DELETE',
        `/api/v1/Agenda/Deletar/${codigo}`,
        undefined,
        params,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.cancelAgendamento', error);
    }
  }

  async getAvailableSchedules(
    integration: IntegrationDocument,
    request: HorariosDisponiveisRequest,
  ): Promise<PDResponseHorariosDisponiveisViewModel> {
    try {
      return await this.makeRequest<PDResponseHorariosDisponiveisViewModel>(
        integration,
        'POST',
        '/api/v1/Agenda/BuscarHorariosDisponiveis',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.getAvailableSchedules', error);
    }
  }

  // ========== PROCEDIMENTOS ==========

  async listProcedimentos(
    integration: IntegrationDocument,
    request: {
      descricao?: string;
      tabela?: CodigoBaseRequest;
      quantidade?: number;
    },
  ): Promise<PDResponse<{ total: number; itens: any[] }>> {
    try {
      return await this.makeRequest<PDResponse<{ total: number; itens: any[] }>>(
        integration,
        'POST',
        '/api/v1/Procedimentos',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.listProcedimentos', error);
    }
  }

  async getProcedimentoDetails(
    integration: IntegrationDocument,
    tabelaCodigo: number,
    procedimentoCodigo: string,
  ): Promise<PDResponse<any>> {
    try {
      return await this.makeRequest<PDResponse<any>>(
        integration,
        'GET',
        `/api/v1/Procedimentos/Detalhar/${tabelaCodigo}/${procedimentoCodigo}`,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.getProcedimentoDetails', error);
    }
  }

  async listTabelasProcedimentos(
    integration: IntegrationDocument,
    request: { quantidade?: number } = {},
  ): Promise<PDResponse<{ total: number; itens: any[] }>> {
    try {
      return await this.makeRequest<PDResponse<{ total: number; itens: any[] }>>(
        integration,
        'POST',
        '/api/v1/TabelasProcedimentos',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.listTabelasProcedimentos', error);
    }
  }
}
