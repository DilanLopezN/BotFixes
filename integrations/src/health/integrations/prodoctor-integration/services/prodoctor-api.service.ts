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

import {
  PDResponseBasicUsuarioViewModel,
  PDResponseLocalProdoctorBasicoViewModel,
  PDResponseConvenioBasicViewModel,
  UsuarioListarRequest,
  LocalProdoctorListarRequest,
  ConvenioListarRequest,
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
import { HttpErrorOrigin, HTTP_ERROR_THROWER, INTERNAL_ERROR_THROWER } from '../../../../common/exceptions.service';
import { formatException } from '../../../../common/helpers/format-exception-audit';

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

  /**
   * Obtém configurações da integração
   */
  private async getConfig(integration: IntegrationDocument): Promise<ProdoctorConfig> {
    return await this.credentialsHelper.getConfig<ProdoctorConfig>(integration);
  }

  /**
   * Faz requisição para a API ProDoctor
   * Suporta fake API para testes
   */
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

      // Se estiver usando fake API
      const baseUrl = config.useFakeApi ? 'http://localhost:7575' : config.apiUrl;

      const url = `${baseUrl}${endpoint}`;

      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Adicionar headers de autenticação apenas para API real
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

      // Debug request
      this.debugRequest(integration, { url, method, data, params }, methodName);

      // Audit request
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

      // Audit response
      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      // Handle error
      await this.handleResponseError(integration, error, data, methodName);

      // Extrair mensagem de erro da API ProDoctor
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

  /**
   * Valida conexão com a API ProDoctor
   * Tenta listar usuários como teste de conectividade
   */
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

  /**
   * Lista usuários (médicos/profissionais)
   */
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

  /**
   * Lista locais ProDoctor (unidades)
   */
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

  /**
   * Lista convênios
   */
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

  /**
   * Busca paciente por CPF, nome ou telefone
   * Endpoint: POST /api/v1/Paciente/Buscar
   */
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
      // Se paciente não encontrado, retornar null ao invés de erro
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

  /**
   * Busca paciente por CPF (helper)
   */
  async getPatientByCpf(
    integration: IntegrationDocument,
    cpf: string,
    localProDoctorCodigo?: number,
  ): Promise<PDResponsePacienteSearchViewModel> {
    const request: PacienteBuscarRequest = {
      cpf: cpf.replace(/\D/g, ''), // Remove formatação
    };

    if (localProDoctorCodigo) {
      request.localProDoctor = { codigo: localProDoctorCodigo };
    }

    return await this.searchPatient(integration, request);
  }

  /**
   * Detalha paciente por código
   * Endpoint: GET /api/v1/Paciente/Detalhar/{codigo}
   */
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

  /**
   * Insere novo paciente
   * Endpoint: POST /api/v1/Pacientes/Inserir
   */
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
      // Tratar erro de paciente já existente
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

  /**
   * Atualiza paciente existente
   * Endpoint: PUT /api/v1/Pacientes/Alterar
   */
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

  /**
   * Lista pacientes com filtros
   * Endpoint: POST /api/v1/Pacientes/Listar
   */
  async listPatients(
    integration: IntegrationDocument,
    request: PacienteListarRequest,
  ): Promise<PDResponsePacienteListaViewModel> {
    try {
      return await this.makeRequest<PDResponsePacienteListaViewModel>(
        integration,
        'POST',
        '/api/v1/Pacientes/Listar',
        request,
      );
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.listPatients', error);
    }
  }

  /**
   * Exclui paciente
   * Endpoint: DELETE /api/v1/Pacientes/Excluir/{codigo}
   */
  async deletePatient(integration: IntegrationDocument, patientCode: number): Promise<void> {
    try {
      await this.makeRequest<void>(integration, 'DELETE', `/api/v1/Pacientes/Excluir/${patientCode}`);
    } catch (error) {
      throw INTERNAL_ERROR_THROWER('ProdoctorApiService.deletePatient', error);
    }
  }
}
