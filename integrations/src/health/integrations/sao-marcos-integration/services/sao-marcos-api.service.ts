import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import {
  SaoMarcosInsurancePlansResponse,
  SaoMarcosInsurancesResponse,
  SaoMarcosOrganizationUnitsResponse,
  SaoMarcosProceduresResponse,
  SaoMarcosCreatePatienResponse,
  SaoMarcosCreatePatient,
  SaoMarcosGetPatientResponse,
  SaoMarcosSpecialitiesResponse,
  SaoMarcosSpecialitiesParamsRequest,
  SaoMarcosProceduresParamsRequest,
  SaoMarcosInsurancePlansParamsRequest,
  SaoMarcosInsurancesParamsRequest,
  SaoMarcosDoctorsParamsRequest,
  SaoMarcosDoctorsResponse,
  SaoMarcosUpdatePatient,
  SaoMarcosUpdatePatientResponse,
  SaoMarcosAppointmentTypeResponse,
  SaoMarcosCancelSchedule,
  SaoMarcosCreateSchedule,
  SaoMarcosPatientSchedules,
  SaoMarcosPatientSchedulesResponse,
  SaoMarcosAvailableSchedules,
  SaoMarcosAvailableSchedulesResponse,
  SaoMarcosCreateScheduleResponse,
  SaoMarcosRescheduleResponse,
  SaoMarcosReschedule,
  SaoMarcoListSchedulesResponse,
  SaoMarcoListSchedules,
  SaoMarcosConfirmSchedulePayload,
  SaoMarcosConfirmScheduleResponse,
  SaoMarcosCancelScheduleResponse,
} from '../interfaces';
import * as Sentry from '@sentry/node';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import * as contextService from 'request-context';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import * as https from 'https';
import { AuditDataType } from '../../../audit/audit.interface';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { SaoMarcosCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

@Injectable()
export class SaoMarcosApiService {
  private readonly logger = new Logger(SaoMarcosApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.defaults.httpsAgent = httpsAgent;
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.SAO_MARCOS).inc();
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

    this.logger.debug(`${integration._id}:${integration.name}:SAO-MARCOS-debug:${funcName}`, payload);
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
        message: `${integration._id}:${integration.name}:SAO_MARCOS-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error?.response, metadata),
      });
    }
  }

  private async getHeaders(integration: IntegrationDocument) {
    const { apiToken } = await this.credentialsHelper.getConfig<SaoMarcosCredentialsResponse>(integration);

    if (!apiToken) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'Invalid api token',
      });
    }

    return {
      headers: {
        authorization: `Bearer ${apiToken}`,
      },
    };
  }

  public async getOrganizationUnits(integration: IntegrationDocument): Promise<SaoMarcosOrganizationUnitsResponse[]> {
    try {
      this.debugRequest(integration, {}, this.getOrganizationUnits.name);
      this.dispatchAuditEvent(integration, {}, this.getOrganizationUnits.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosOrganizationUnitsResponse[]>('/cadastrobases/ListarUnidade', undefined, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(
        integration,
        response?.data,
        this.getOrganizationUnits.name,
        AuditDataType.externalResponse,
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getOrganizationUnits');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurances(
    integration: IntegrationDocument,
    payload: SaoMarcosInsurancesParamsRequest,
  ): Promise<SaoMarcosInsurancesResponse[]> {
    try {
      this.debugRequest(integration, payload, this.getInsurances.name);
      this.dispatchAuditEvent(integration, payload, this.getInsurances.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosInsurancesResponse[]>('/cadastrobases/ListarConvenio', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getInsurances.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getInsurances');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurancePlans(
    integration: IntegrationDocument,
    payload: SaoMarcosInsurancePlansParamsRequest,
  ): Promise<SaoMarcosInsurancePlansResponse[]> {
    try {
      this.debugRequest(integration, payload, this.getInsurancePlans.name);
      this.dispatchAuditEvent(integration, payload, this.getInsurancePlans.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosInsurancePlansResponse[]>('/cadastrobases/ListarPlano', payload, {
          headers: {
            ...(await this.getHeaders(integration)).headers,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getInsurancePlans.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getInsurancePlans');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getSpecialities(
    integration: IntegrationDocument,
    payload: SaoMarcosSpecialitiesParamsRequest,
  ): Promise<SaoMarcosSpecialitiesResponse[]> {
    try {
      this.debugRequest(integration, payload, this.getSpecialities.name);
      this.dispatchAuditEvent(integration, payload, this.getSpecialities.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosSpecialitiesResponse[]>('/cadastrobases/ListarEspecialidade', payload, {
          headers: {
            ...(await this.getHeaders(integration)).headers,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getSpecialities.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getSpecialities');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedures(
    integration: IntegrationDocument,
    payload: SaoMarcosProceduresParamsRequest,
  ): Promise<SaoMarcosProceduresResponse[]> {
    try {
      this.debugRequest(integration, payload, this.getProcedures.name);
      this.dispatchAuditEvent(integration, payload, this.getProcedures.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosProceduresResponse[]>('/cadastrobases/ListarProcedimento', payload, {
          headers: {
            ...(await this.getHeaders(integration)).headers,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getProcedures.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getProcedures');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAppointmentTypes(integration: IntegrationDocument): Promise<SaoMarcosAppointmentTypeResponse[]> {
    try {
      this.debugRequest(integration, {}, this.getAppointmentTypes.name);
      this.dispatchAuditEvent(integration, {}, this.getAppointmentTypes.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosAppointmentTypeResponse[]>('/cadastrobases/TipoAgendamento', undefined, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(
        integration,
        response?.data,
        this.getAppointmentTypes.name,
        AuditDataType.externalResponse,
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getAppointmentTypes');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getDoctors(
    integration: IntegrationDocument,
    payload: SaoMarcosDoctorsParamsRequest,
  ): Promise<SaoMarcosDoctorsResponse[]> {
    try {
      this.debugRequest(integration, payload, this.getDoctors.name);
      this.dispatchAuditEvent(integration, payload, this.getDoctors.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosDoctorsResponse[]>('/cadastrobases/ListarMedico', payload, {
          headers: {
            ...(await this.getHeaders(integration)).headers,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getDoctors.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getDoctors');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: SaoMarcosCreatePatient,
  ): Promise<SaoMarcosCreatePatienResponse> {
    try {
      this.debugRequest(integration, payload, this.createPatient.name);
      this.dispatchAuditEvent(integration, payload, this.createPatient.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosCreatePatienResponse>('/pacientes/AdicionarPaciente', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.createPatient.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, this.createPatient.name);
      if (error?.response?.status === HttpStatus.CONFLICT) {
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

  public async updatePatient(
    integration: IntegrationDocument,
    payload: SaoMarcosUpdatePatient,
  ): Promise<SaoMarcosUpdatePatientResponse> {
    try {
      this.debugRequest(integration, payload, this.updatePatient.name);
      this.dispatchAuditEvent(integration, payload, this.updatePatient.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosUpdatePatientResponse>('/pacientes/AtualizarPaciente', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.updatePatient.name, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, this.updatePatient.name);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientByCpf(
    integration: IntegrationDocument,
    patientCpf: string,
  ): Promise<SaoMarcosGetPatientResponse> {
    try {
      this.debugRequest(integration, { patientCpf }, this.getPatientByCpf.name);
      this.dispatchAuditEvent(integration, { patientCpf }, this.getPatientByCpf.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosGetPatientResponse>(
          '/pacientes/ObterPacientePorCpf',
          {
            cpf: patientCpf,
          },
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getPatientByCpf.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getPatientByCpf');
      if (error?.response?.status === HttpStatus.NO_CONTENT) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientByCode(
    integration: IntegrationDocument,
    patientCode: string,
  ): Promise<SaoMarcosGetPatientResponse> {
    try {
      this.debugRequest(integration, { patientCode }, this.getPatientByCode.name);
      this.dispatchAuditEvent(integration, { patientCode }, this.getPatientByCode.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosGetPatientResponse>(
          '/pacientes/ObterPacientePorCodigo',
          {
            codigo: patientCode,
          },
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getPatientByCode.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, 'getPatientByCode');
      if (error?.response?.status === HttpStatus.NO_CONTENT) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
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
    payload: SaoMarcosCancelSchedule,
  ): Promise<SaoMarcosCancelScheduleResponse> {
    try {
      this.debugRequest(integration, payload, this.cancelSchedule.name);
      this.dispatchAuditEvent(integration, payload, this.cancelSchedule.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosCancelScheduleResponse>('/agendamentoonlines/CancelarAgendamento', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.cancelSchedule.name, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, this.cancelSchedule.name);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    payload: SaoMarcosCreateSchedule,
  ): Promise<SaoMarcosCreateScheduleResponse> {
    try {
      this.debugRequest(integration, payload, this.createSchedule.name);
      this.dispatchAuditEvent(integration, payload, this.createSchedule.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosCreateScheduleResponse>('/agendamentoonlines/AdicionarAgendamento', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.createSchedule.name, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, this.createSchedule.name);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async reschedule(
    integration: IntegrationDocument,
    payload: SaoMarcosReschedule,
  ): Promise<SaoMarcosRescheduleResponse> {
    try {
      this.debugRequest(integration, payload, this.reschedule.name);
      this.dispatchAuditEvent(integration, payload, this.reschedule.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosCreateScheduleResponse>('/agendamentoonlines/ReagendarAgendamento', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.reschedule.name, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, this.reschedule.name);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    payload: SaoMarcosPatientSchedules,
  ): Promise<SaoMarcosPatientSchedulesResponse[]> {
    try {
      this.debugRequest(integration, payload, this.getPatientSchedules.name);
      this.dispatchAuditEvent(integration, payload, this.getPatientSchedules.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosPatientSchedulesResponse[]>(
          '/agendamentoonlines/ListarAgendamentosPaciente',
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(
        integration,
        response?.data,
        this.getPatientSchedules.name,
        AuditDataType.externalResponse,
      );

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getPatientSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAvailableSchedules(
    integration: IntegrationDocument,
    payload: SaoMarcosAvailableSchedules,
  ): Promise<SaoMarcosAvailableSchedulesResponse[]> {
    try {
      this.debugRequest(integration, payload, this.getAvailableSchedules.name);
      this.dispatchAuditEvent(integration, payload, this.getAvailableSchedules.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosAvailableSchedulesResponse[]>('/agendamentoonlines/ListarHorarios', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(
        integration,
        response?.data,
        this.getAvailableSchedules.name,
        AuditDataType.externalResponse,
      );
      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'getAvailableSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSchedules(
    integration: IntegrationDocument,
    payload: SaoMarcoListSchedules,
  ): Promise<SaoMarcoListSchedulesResponse[]> {
    try {
      this.debugRequest(integration, payload, this.listSchedules.name);
      this.dispatchAuditEvent(integration, payload, this.listSchedules.name, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<SaoMarcoListSchedulesResponse[]>('/agendamentoonlines/ListarAgendamentos', payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.listSchedules.name, AuditDataType.externalResponse);

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

  public async confirmSchedule(
    integration: IntegrationDocument,
    payload: SaoMarcosConfirmSchedulePayload,
  ): Promise<SaoMarcosConfirmScheduleResponse> {
    try {
      this.debugRequest(integration, payload, this.confirmSchedule.name);
      this.dispatchAuditEvent(integration, payload, this.confirmSchedule.name, AuditDataType.externalRequest);

      const { externalId } = payload;

      const headers = await this.getHeaders(integration);
      const token = headers.headers.authorization.split('Bearer ')[1]?.trim();

      // O que difere da confirmação pro cancelamento é o status e a mensagem
      // 1 = Confirmado
      // 2 = Cancelado
      // setado o status e a mensagem como de confirmação
      const response = await lastValueFrom(
        this.httpService.post<SaoMarcosConfirmScheduleResponse>(
          '/agendamentoonlines/ConfirmaCancela',
          { status: '1', message: 'Confirmado', externalId, token },
          {
            ...headers,
          },
        ),
      );

      // Alguns erros não são lançados com HTTP STATUS 400, mas sim como status no response
      if (response.data?.status !== 200) {
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, response.data, HttpErrorOrigin.INTEGRATION_ERROR);
      }

      this.dispatchAuditEvent(integration, response?.data, this.confirmSchedule.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, 'confirmSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
