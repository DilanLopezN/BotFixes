import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AxiosRequestConfig } from 'axios';
import * as contextService from 'request-context';
import { lastValueFrom } from 'rxjs';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { cleanseObject } from '../../../../common/helpers/cleanse-object';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { AuditDataType } from '../../../audit/audit.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import { IntegrationType } from '../../../interfaces/integration-types';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import {
  MatrixAvailableSchedules,
  MatrixAvailableSchedulesResponse,
  MatrixBlockSchedule,
  MatrixBlockScheduleResponse,
  MatrixCancelScheduleParams,
  MatrixConfirmScheduleParams,
  MatrixCreateScheduleResponse,
  MatrixCreateSchedules,
} from '../interfaces/appointment.interface';
import {
  MatrixDoctorPayloadRequest,
  MatrixDoctorResponse,
  MatrixInsurancesAndPlansResponse,
  MatrixOrganizationUnitsPayloadRequest,
  MatrixOrganizationUnitsResponse,
  MatrixProcedureDataRequest,
  MatrixProcedureDataResponse,
  MatrixProceduresPayloadRequest,
  MatrixProceduresResponse,
  MatrixSpecialitiesResponse,
} from '../interfaces/base-register.interface';
import {
  MatriListSchedulesDatailedResponse,
  MatrixCreatePatient,
  MatrixCreatePatientResponse,
  MatrixListSchedules,
  MatrixPatientResponse,
  MatrixPatientResponseV2,
  MatrixPatientSchedulesParams,
  MatrixPatientSchedulesResponse,
  MatrixUpdatePatient,
  MatrixUpdatePatientResponse,
} from '../interfaces/patient.interface';
import * as https from 'https';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { MatrixCredentialsResponse } from '../interfaces/credentials';
import axiosRetry from 'axios-retry';
import { RecoverPasswordRequest, RecoverPasswordResponse } from '../interfaces/recover-password.interface';
import { MatrixHelpersService } from './matrix-helpers.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

interface PatientDataToAuth {
  document: string;
  documentType: string;
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

@Injectable()
export class MatrixApiService {
  private readonly logger = new Logger(MatrixApiService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
    private readonly matrixHelpersService: MatrixHelpersService,
  ) {
    this.httpService.axiosRef.defaults.httpsAgent = httpsAgent;
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.MATRIX).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    axiosRetry(this.httpService.axiosRef, {
      retries: 3,
      retryDelay: (retryCount) => {
        return retryCount * retryCount * 500;
      },
      retryCondition: (error) => {
        return error?.response?.status > 400 || error?.code === 'ECONNABORTED';
      },
    });
  }

  private debugRequest(integration: IntegrationDocument, payload: any, funcName: string) {
    if (!integration.debug) {
      return;
    }

    this.logger.debug(`${integration._id}:${integration.name}:MATRIX-debug:${funcName}`, payload);
  }

  private async getApiUrl(integration: IntegrationDocument, url: string): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<MatrixCredentialsResponse>(integration);
    return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  public async getLoginToken(integration: IntegrationDocument, ignoreException?: boolean): Promise<string> {
    try {
      const { authApiUsername: login, authApiPassword: senha } =
        await this.credentialsHelper.getConfig<MatrixCredentialsResponse>(integration);

      const payload = { login, senha };
      const url = await this.getApiUrl(integration, 'login');
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(this.httpService.post<{ token: string }>(url, payload, config));

      return request?.data.token ?? undefined;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.getLoginToken.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
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

  private async getConfigWithToken(integration: IntegrationDocument) {
    const token = await this.matrixHelpersService.getLoginToken(integration);
    return {
      headers: {
        Token: `Bearer ${token}`,
      },
    };
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

    if (error?.response?.data && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      const metadata = contextService.get('req:default-headers');
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:MATRIX-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private async getPublicParams(integration: IntegrationDocument): Promise<Pick<AxiosRequestConfig, 'headers'>> {
    const { apiToken } = await this.credentialsHelper.getConfig<MatrixCredentialsResponse>(integration);

    if (!apiToken) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'Invalid api token',
      });
    }

    return {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    };
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: MatrixCreatePatient,
  ): Promise<MatrixCreatePatientResponse> {
    const methodName = 'createPatient';

    try {
      payload = cleanseObject(payload, { replaceNegativeWithEmptyString: true });
    } catch (error) {}

    this.debugRequest(integration, payload, this.createPatient.name);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<MatrixCreatePatientResponse>(
          await this.getApiUrl(integration, '/cria-paciente'),
          payload,
          {
            ...config,
          },
        ),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    payload: MatrixUpdatePatient,
  ): Promise<MatrixUpdatePatientResponse> {
    const methodName = 'updatePatient';
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<MatrixUpdatePatientResponse>(
          await this.getApiUrl(integration, '/atualiza-paciente'),
          payload,
          {
            ...config,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error?.response, payload, 'updatePatient');
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

  public async getMatrixPatient(
    integration: IntegrationDocument,
    patient: PatientDataToAuth,
  ): Promise<MatrixPatientResponse> {
    this.debugRequest(integration, patient, this.getMatrixPatient.name);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<MatrixPatientResponse>(
          await this.getApiUrl(integration, '/busca-paciente/'),
          { documento: patient.document, tipoDocumento: patient.documentType },
          {
            ...config,
          },
        ),
      );

      return response?.data[0];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'getMatrixPatient');
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getMatrixPatientWithToken(
    integration: IntegrationDocument,
    patient: PatientDataToAuth,
    ignoreException?: boolean,
  ): Promise<MatrixPatientResponseV2[]> {
    try {
      const url = await this.getApiUrl(integration, '/busca-paciente');
      const config = await this.getConfigWithToken(integration);
      const request = await lastValueFrom(
        this.httpService.post<MatrixPatientResponseV2[]>(
          url,
          { documento: patient.document, tipoDocumento: patient.documentType },
          config,
        ),
      );

      return request?.data ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, patient, this.getMatrixPatient.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async recoverPassword(
    integration: IntegrationDocument,
    payload: RecoverPasswordRequest,
    ignoreException?: boolean,
  ): Promise<RecoverPasswordResponse> {
    try {
      const url = await this.getApiUrl(integration, '/reinicia-senha');
      const config = await this.getConfigWithToken(integration);
      const request = await lastValueFrom(this.httpService.post<RecoverPasswordResponse>(url, payload, config));
      return request?.data ?? undefined;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, this.recoverPassword.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    ignoreException?: boolean,
  ): Promise<MatrixOrganizationUnitsResponse['unidades']> {
    this.debugRequest(integration, {}, this.listOrganizationUnits.name);

    try {
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(
        this.httpService.get<MatrixOrganizationUnitsResponse>(await this.getApiUrl(integration, '/busca-unidade'), {
          ...config,
        }),
      );

      return request?.data.unidades;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listOrganizationUnits', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listOrganizationUnitsWithParams(
    integration: IntegrationDocument,
    payload: MatrixOrganizationUnitsPayloadRequest,
    ignoreException?: boolean,
  ): Promise<MatrixOrganizationUnitsResponse['unidades']> {
    this.debugRequest(integration, {}, this.listOrganizationUnits.name);

    try {
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(
        this.httpService.post<MatrixOrganizationUnitsResponse>(
          await this.getApiUrl(integration, '/busca-unidade'),
          payload,
          {
            ...config,
          },
        ),
      );

      return request?.data.unidades;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listOrganizationUnitsWithParams', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    ignoreException?: boolean,
  ): Promise<MatrixInsurancesAndPlansResponse['convenios']> {
    this.debugRequest(integration, {}, this.listInsurances.name);

    try {
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(
        this.httpService.get<MatrixInsurancesAndPlansResponse>(await this.getApiUrl(integration, '/busca-convenio'), {
          ...config,
        }),
      );

      return request?.data.convenios;
    } catch (error) {
      await this.handleResponseError(integration, error, {}, 'listInsurances', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    ignoreException?: boolean,
  ): Promise<MatrixInsurancesAndPlansResponse> {
    this.debugRequest(integration, {}, this.listInsurancePlans.name);

    try {
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(
        this.httpService.get<MatrixInsurancesAndPlansResponse>(await this.getApiUrl(integration, '/busca-convenio'), {
          ...config,
        }),
      );

      return request.data;
    } catch (error) {
      await this.handleResponseError(integration, error, {}, 'listInsurancesPlans', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    payload: MatrixDoctorPayloadRequest,
    ignoreException?: boolean,
  ): Promise<MatrixDoctorResponse['responsaveis']> {
    this.debugRequest(integration, payload, this.listDoctors.name);

    try {
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(
        this.httpService.post<MatrixDoctorResponse>(await this.getApiUrl(integration, '/responsavel'), payload, {
          ...config,
        }),
      );

      return request?.data.responsaveis;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listDoctors', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    ignoreException?: boolean,
  ): Promise<MatrixSpecialitiesResponse['setores']> {
    this.debugRequest(integration, {}, this.listSpecialities.name);

    try {
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(
        this.httpService.get<MatrixSpecialitiesResponse>(await this.getApiUrl(integration, '/busca-setores'), {
          ...config,
        }),
      );

      return request?.data.setores;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listSpecialities', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    payload: MatrixProceduresPayloadRequest,
    ignoreException?: boolean,
  ): Promise<MatrixProceduresResponse['procedimentos']> {
    this.debugRequest(integration, payload, this.listProcedures.name);

    try {
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(
        this.httpService.post<MatrixProceduresResponse>(
          await this.getApiUrl(integration, '/busca-procedimentos'),
          payload,
          {
            ...config,
          },
        ),
      );

      return request?.data.procedimentos;
    } catch (error) {
      if (error?.response?.status === HttpStatus.BAD_REQUEST && error?.response?.data.erro.includes('vazia')) {
        return [];
      }
      await this.handleResponseError(integration, error, undefined, 'listProcedures', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableSchedules(
    integration: IntegrationDocument,
    payload: MatrixAvailableSchedules,
    useIntelligentSearch = false,
  ): Promise<MatrixAvailableSchedulesResponse['procedimentos']> {
    const url = useIntelligentSearch ? '/busca-horario-inteligente' : '/busca-horarios';
    const methodName = useIntelligentSearch ? 'listAvailableSchedulesIntelligent' : 'listAvailableSchedules';

    try {
      payload = cleanseObject(payload, { replaceNegativeWithEmptyString: true });
    } catch (error) {}

    this.debugRequest(integration, payload, methodName);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<MatrixAvailableSchedulesResponse>(await this.getApiUrl(integration, url), payload, {
          ...config,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data?.procedimentos ?? [];
    } catch (error) {
      if (
        [
          'Não foram encontrados horários disponíveis',
          'Não foi possível carregar os horários disponíveis',
          'Não foi possível traduzir o código',
        ].some((substring) => error?.response?.data?.erro?.includes(substring))
      ) {
        return [];
      }
      await this.handleResponseError(integration, error, payload, 'listAvailableSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async blockSchedule(
    integration: IntegrationDocument,
    payload: MatrixBlockSchedule,
  ): Promise<MatrixBlockScheduleResponse> {
    const methodName = 'blockSchedule';

    try {
      payload = cleanseObject(payload, { replaceNegativeWithEmptyString: true });
    } catch (error) {}

    this.debugRequest(integration, payload, this.blockSchedule.name);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<MatrixBlockScheduleResponse>(
          await this.getApiUrl(integration, '/cria-reserva-horario'),
          payload,
          {
            ...config,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, 'blockSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    payload: MatrixCreateSchedules,
  ): Promise<MatrixCreateScheduleResponse['agendamentos']> {
    const methodName = 'createSchedule';

    try {
      payload = cleanseObject(payload, { replaceNegativeWithEmptyString: true });
    } catch (error) {}

    this.debugRequest(integration, payload, this.createSchedule.name);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<MatrixCreateScheduleResponse>(
          await this.getApiUrl(integration, '/grava-marcacao-horario'),
          payload,
          {
            ...config,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data.agendamentos;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, 'createSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPatientSchedules(
    integration: IntegrationDocument,
    params: MatrixPatientSchedulesParams,
  ): Promise<MatrixPatientSchedulesResponse['agendamentos']> {
    try {
      params = cleanseObject(params, { replaceNegativeWithEmptyString: true });
    } catch (error) {}

    this.debugRequest(integration, params, this.listPatientSchedules.name);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<MatrixPatientSchedulesResponse>(
          await this.getApiUrl(integration, '/lista-marcacoes-paciente'),
          params,
          {
            ...config,
          },
        ),
      );

      return response?.data.agendamentos;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'listPatientSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSchedules(
    integration: IntegrationDocument,
    params: MatrixListSchedules,
  ): Promise<MatriListSchedulesDatailedResponse['agendamentosDetalhados']> {
    try {
      params = cleanseObject(params, { replaceNegativeWithEmptyString: true });
    } catch (error) {}

    this.debugRequest(integration, params, this.listSchedules.name);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<MatriListSchedulesDatailedResponse>(
          await this.getApiUrl(integration, '/lista-marcacoes-detalhada'),
          params,
          {
            ...config,
          },
        ),
      );

      return response?.data.agendamentosDetalhados;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'listSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelSchedule(integration: IntegrationDocument, params: MatrixCancelScheduleParams): Promise<void> {
    const methodName = 'cancelSchedule';

    this.debugRequest(integration, params, this.cancelSchedule.name);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<void>(await this.getApiUrl(integration, '/desmarca-agendamento'), params, {
          ...config,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      try {
        // Identificado com a Marina da tecnolab que sempre que retorna este erro
        // é porque o agendamento já foi cancelado dentro do erp. Então foi acordado
        // que ao retornar este erro será tratado como um cancelamento efetuado
        const errorMessage = error?.response?.data?.erro ?? '';
        if (typeof errorMessage === 'string' && errorMessage.includes('Não foi possível desmarcar o agendamento.')) {
          return;
        }
      } catch (e) {
        throw HTTP_ERROR_THROWER(
          error?.response?.status || HttpStatus.BAD_REQUEST,
          e,
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }
      await this.handleResponseError(integration, error, params, 'cancelSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedureData(
    integration: IntegrationDocument,
    payload: MatrixProcedureDataRequest,
  ): Promise<MatrixProcedureDataResponse[]> {
    this.debugRequest(integration, {}, this.getProcedureData.name);

    try {
      const config = await this.getPublicParams(integration);
      const request = await lastValueFrom(
        this.httpService.post<MatrixProcedureDataResponse[]>(
          await this.getApiUrl(integration, '/busca-dado-procedimento'),
          payload,
          {
            ...config,
          },
        ),
      );

      return request?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'getProcedureData');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async confirmSchedule(integration: IntegrationDocument, params: MatrixConfirmScheduleParams): Promise<void> {
    const methodName = 'confirmSchedule';

    this.debugRequest(integration, params, this.confirmSchedule.name);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getPublicParams(integration);
      const response = await lastValueFrom(
        this.httpService.post<void>(await this.getApiUrl(integration, '/confirma-agendamento'), params, {
          ...config,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
