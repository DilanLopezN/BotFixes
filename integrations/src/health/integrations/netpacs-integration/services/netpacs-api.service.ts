import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import {
  BranchesResponse,
  CancelAttendanceRequest,
  CreatePacientResponse,
  CreatePatientRequest,
  DoctorsResponse,
  GetPatientResponse,
  InsurancePlanResponse,
  InsurancesResponse,
  ModalitiesResponse,
  ProceduresResponse,
  ProfessionalsResponse,
  AttendanceResponse,
  SchedulesRequestParams,
  SchedulesResponse,
  AttendancesRequestParams,
  UpdateAttendanceStatusRequest,
  CreateScheduleRequest,
  CreateScheduleResponse,
  UpdatePacientResponse,
  UpdatePatientRequest,
  UnitResponse,
  GroupedSchedulesResponse,
  GroupedSchedulesResponseParams,
  GetProcedureValueResponse,
  GetProcedureValueParams,
  FollowUpAppointmentsResponse,
  FollowUpAppointmentsRequestParams,
} from '../interfaces';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { NetpacsCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { NetpacsServiceHelpersService } from './netpacs-helpers.service';

type ParamsType = { [key: string]: string | number | boolean };

@Injectable()
export class NetpacsApiService {
  private readonly logger = new Logger(NetpacsApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
    private readonly netpacsServiceHelpersService: NetpacsServiceHelpersService,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.NETPACS).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  private debugRequest(integration: IntegrationDocument, payload: any, funcName?: string) {
    if (!integration || (!integration.debug && process.env.NODE_ENV !== 'local')) return;

    const base = `${integration._id}:${integration.name}:${IntegrationType.NETPACS}-debug`;
    const label = funcName ? `${base}:${funcName}` : base;

    this.logger.debug(label, payload);
  }

  private async getHeaders(integration: IntegrationDocument) {
    const { apiToken } = await this.credentialsHelper.getConfig<NetpacsCredentialsResponse>(integration);

    return {
      headers: {
        authorization: apiToken,
      },
    };
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

    if (error?.response?.data && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      const metadata = contextService.get('req:default-headers');

      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:NETPACS-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private async getApiUrl(integration: IntegrationDocument, url: string): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<NetpacsCredentialsResponse>(integration);
    return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  public async getPatientByCode(integration: IntegrationDocument, code: string): Promise<GetPatientResponse> {
    const methodName = 'getPatientByCode';
    this.debugRequest(integration, { code }, methodName);
    try {
      this.debugRequest(integration, { code }, 'getPatientByCode');
      const request = await lastValueFrom(
        this.httpService.get<GetPatientResponse>(await this.getApiUrl(integration, `/netris/api/pacientes/${code}`), {
          ...(await this.getHeaders(integration)),
        }),
      );

      if (!request?.data) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { code }, methodName);
      if (error?.response?.status === HttpStatus.NO_CONTENT) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientByCpf(integration: IntegrationDocument, cpf: string): Promise<GetPatientResponse[]> {
    const methodName = 'getPatientByCpf';
    this.debugRequest(integration, { cpf }, methodName);
    try {
      this.debugRequest(integration, { cpf }, 'getPatientByCpf');
      const request = await lastValueFrom(
        this.httpService.get<GetPatientResponse[]>(await this.getApiUrl(integration, '/netris/api/pacientes'), {
          ...(await this.getHeaders(integration)),
          params: {
            cpf,
          },
        }),
      );

      if (!request?.data || request?.data?.length === 0) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { cpf }, methodName);
      if (error?.response?.status === HttpStatus.NO_CONTENT) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: CreatePatientRequest,
  ): Promise<CreatePacientResponse> {
    const methodName = 'createPatient';
    this.debugRequest(integration, payload, methodName);

    try {
      this.debugRequest(integration, payload, methodName);
      const response = await lastValueFrom(
        this.httpService.post<CreatePacientResponse>(
          await this.getApiUrl(integration, '/netris/api/pacientes'),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      if (response?.data?.idPaciente === null) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          {
            message: 'User already exists',
          },
          HttpErrorOrigin.INTEGRATION_ERROR,
        );
      }

      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getBranches1(integration: IntegrationDocument, params?: ParamsType): Promise<BranchesResponse[]> {
    const methodName = 'getBranches1';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getBranches');
      const request = await lastValueFrom(
        this.httpService.get<BranchesResponse[]>(await this.getApiUrl(integration, '/netris/api/filiais'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listUnits(
    integration: IntegrationDocument,
    params?: ParamsType,
    ignoreException?: boolean,
  ): Promise<UnitResponse[]> {
    const methodName = 'listUnits';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'listUnits');
      const request = await lastValueFrom(
        this.httpService.get<UnitResponse[]>(await this.getApiUrl(integration, '/netris/api/unidades'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedures(integration: IntegrationDocument, params?: ParamsType): Promise<ProceduresResponse[]> {
    const methodName = 'getProcedures';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getProcedures');
      const request = await lastValueFrom(
        this.httpService.get<ProceduresResponse[]>(await this.getApiUrl(integration, '/netris/api/procedimentos'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProceduresByInsurance(
    integration: IntegrationDocument,
    params?: ParamsType,
  ): Promise<ProceduresResponse[]> {
    const methodName = 'getProceduresByInsurance';
    this.debugRequest(integration, params, methodName);
    const { id_plano_convenio, ...otherParams } = params;

    try {
      this.debugRequest(integration, params, 'getProceduresByInsurance');
      if (params.id_plano_convenio) {
        const request = await lastValueFrom(
          this.httpService.get<ProceduresResponse[]>(
            await this.getApiUrl(integration, `/netris/api/procedimentos/planoConvenio/${params.id_plano_convenio}`),
            {
              ...(await this.getHeaders(integration)),
              params: otherParams,
            },
          ),
        );
        return request?.data;
      }

      return [];
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedure(integration: IntegrationDocument, procedureId: number): Promise<ProceduresResponse> {
    const methodName = 'getProcedure';
    this.debugRequest(integration, { procedureId }, methodName);
    try {
      this.debugRequest(integration, { procedureId }, 'getProcedure');
      const request = await lastValueFrom(
        this.httpService.get<ProceduresResponse>(
          await this.getApiUrl(integration, `/netris/api/procedimentos/${procedureId}`),
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { procedureId }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getModalities(integration: IntegrationDocument, params?: ParamsType): Promise<ModalitiesResponse[]> {
    const methodName = 'getModalities';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getModalities');
      const request = await lastValueFrom(
        this.httpService.get<ModalitiesResponse[]>(await this.getApiUrl(integration, '/netris/api/modalidades'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurances(integration: IntegrationDocument, params?: ParamsType): Promise<InsurancesResponse[]> {
    const methodName = 'getInsurances';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getInsurances');
      const request = await lastValueFrom(
        this.httpService.get<InsurancesResponse[]>(await this.getApiUrl(integration, '/netris/api/convenios'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurancePlans(
    integration: IntegrationDocument,
    params?: ParamsType,
  ): Promise<InsurancePlanResponse[]> {
    const methodName = 'getInsurancePlans';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getInsurancePlans');
      const request = await lastValueFrom(
        this.httpService.get<InsurancePlanResponse[]>(
          await this.getApiUrl(integration, '/netris/api/plano-convenios'),
          {
            ...(await this.getHeaders(integration)),
            params,
          },
        ),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getDoctors(integration: IntegrationDocument, params?: ParamsType): Promise<DoctorsResponse[]> {
    const methodName = 'getDoctors';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getDoctors');
      const request = await lastValueFrom(
        this.httpService.get<DoctorsResponse[]>(await this.getApiUrl(integration, '/netris/api/medicos'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProfessionals(
    integration: IntegrationDocument,
    params?: ParamsType,
  ): Promise<ProfessionalsResponse[]> {
    const methodName = 'getProfessionals';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getProfessionals');
      const request = await lastValueFrom(
        this.httpService.get<ProfessionalsResponse[]>(await this.getApiUrl(integration, '/netris/api/profissionais'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getSchedules(
    integration: IntegrationDocument,
    params: SchedulesRequestParams,
  ): Promise<SchedulesResponse[][]> {
    const methodName = 'getSchedules';
    this.debugRequest(integration, params, methodName);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<SchedulesResponse[][]>(await this.getApiUrl(integration, '/netris/api/horarios'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelAttendance(
    integration: IntegrationDocument,
    attendanceId: string,
    payload: CancelAttendanceRequest,
  ): Promise<void> {
    const methodName = 'cancelAttendance';
    this.debugRequest(integration, { attendanceId, payload }, methodName);
    try {
      this.debugRequest(integration, { attendanceId, payload }, methodName);
      const response = await lastValueFrom(
        this.httpService.patch<void>(
          await this.getApiUrl(integration, `/netris/api/atendimentos/${attendanceId}/cancelar`),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      // Se for erro esperado, não envia ao Sentry e retorna sucesso
      if (this.netpacsServiceHelpersService.isExpectedAttendanceError(error)) {
        return;
      }

      this.handleResponseError(integration, error, { attendanceId, payload }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updateAttendanceStatus(
    integration: IntegrationDocument,
    attendanceId: string,
    payload: UpdateAttendanceStatusRequest,
  ): Promise<void> {
    const methodName = 'updateAttendanceStatus';
    this.debugRequest(integration, { attendanceId, payload }, methodName);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.patch<void>(
          await this.getApiUrl(integration, `/netris/api/atendimentos/${attendanceId}/alterar-situacao`),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      // Se for erro esperado, não envia ao Sentry e retorna sucesso
      if (this.netpacsServiceHelpersService.isExpectedAttendanceError(error)) {
        return;
      }

      this.handleResponseError(integration, error, { attendanceId, payload }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAttendance(integration: IntegrationDocument, attendanceId: string): Promise<AttendanceResponse> {
    const methodName = 'getAttendance';
    this.debugRequest(integration, { attendanceId }, methodName);
    try {
      this.debugRequest(integration, { attendanceId }, 'getAttendance');
      const request = await lastValueFrom(
        this.httpService.get<AttendanceResponse>(
          await this.getApiUrl(integration, `/netris/api/atendimentos/${attendanceId}`),
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { attendanceId }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAttendances(
    integration: IntegrationDocument,
    params: AttendancesRequestParams,
  ): Promise<AttendanceResponse[]> {
    const methodName = 'getAttendances';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getAttendances');
      const request = await lastValueFrom(
        this.httpService.get<AttendanceResponse[]>(await this.getApiUrl(integration, '/netris/api/atendimentos'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getLostAttendances(
    integration: IntegrationDocument,
    params: AttendancesRequestParams,
  ): Promise<AttendanceResponse[]> {
    const methodName = 'getLostAttendances';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getLostAttendances');
      const request = await lastValueFrom(
        this.httpService.get<AttendanceResponse[]>(
          await this.getApiUrl(integration, '/netris/api/atendimentos/pacienteFaltou'),
          {
            ...(await this.getHeaders(integration)),
            params,
          },
        ),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    payload: CreateScheduleRequest[],
  ): Promise<CreateScheduleResponse> {
    const methodName = 'createSchedule';
    this.debugRequest(integration, payload, methodName);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await lastValueFrom(
          this.httpService.post<CreateScheduleResponse>(
            await this.getApiUrl(integration, '/netris/api/horarios'),
            payload,
            {
              ...(await this.getHeaders(integration)),
              timeout: 30_000,
            },
          ),
        );

        this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
        return response?.data;
      } catch (error) {
        this.handleResponseError(integration, error, payload, `${methodName} - attempt ${attempt}/${maxRetries}`);

        if (error?.response?.data?.message?.includes('ocupado')) {
          throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
        }

        const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');

        if (!isTimeout || attempt === maxRetries) {
          throw HTTP_ERROR_THROWER(
            error?.response?.status || HttpStatus.BAD_REQUEST,
            error?.response?.data || error,
            HttpErrorOrigin.INTEGRATION_ERROR,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw HTTP_ERROR_THROWER(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Unexpected error in createSchedule',
      HttpErrorOrigin.INTEGRATION_ERROR,
    );
  }

  public async updatePatient(
    integration: IntegrationDocument,
    payload: UpdatePatientRequest,
    patientCode: string,
  ): Promise<UpdatePacientResponse> {
    const methodName = 'updatePatient';
    this.debugRequest(integration, { patientCode, payload }, methodName);
    try {
      this.debugRequest(integration, { patientCode, payload }, 'updatePatient');
      const request = await lastValueFrom(
        this.httpService.put<CreatePacientResponse>(
          await this.getApiUrl(integration, `/netris/api/pacientes/${patientCode}`),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { patientCode, payload }, 'updatePatient');
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProceduresByDoctor(
    integration: IntegrationDocument,
    params: ParamsType,
  ): Promise<ProceduresResponse[]> {
    const methodName = 'listProceduresByDoctor';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'listProceduresByDoctor');
      const request = await lastValueFrom(
        this.httpService.get<ProceduresResponse[]>(
          await this.getApiUrl(integration, `/netris/api/procedimentos/medico/${params.doctorCode}`),
          {
            ...(await this.getHeaders(integration)),
            params,
          },
        ),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listGroupedSchedules(
    integration: IntegrationDocument,
    params: GroupedSchedulesResponseParams,
  ): Promise<GroupedSchedulesResponse[]> {
    const methodName = 'listGroupedSchedules';
    this.debugRequest(integration, params, methodName);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<GroupedSchedulesResponse[]>(
          await this.getApiUrl(integration, '/netris/api/horarios-agrupados'),
          {
            ...(await this.getHeaders(integration)),
            params,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedureValue(
    integration: IntegrationDocument,
    params: GetProcedureValueParams,
  ): Promise<GetProcedureValueResponse> {
    const methodName = 'getProcedureValue';
    this.debugRequest(integration, params, methodName);
    try {
      this.debugRequest(integration, params, 'getProcedureValue');
      const request = await lastValueFrom(
        this.httpService.get<GetProcedureValueResponse>(
          await this.getApiUrl(integration, '/netris/api/consultarPreco'),
          {
            ...(await this.getHeaders(integration)),
            params,
          },
        ),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getFollowUpPatientAppointments(
    integration: IntegrationDocument,
    data: FollowUpAppointmentsRequestParams,
  ): Promise<Array<FollowUpAppointmentsResponse>> {
    const methodName = 'getFollowUpPatientAppointments';
    this.debugRequest(integration, data, methodName);
    this.dispatchAuditEvent(integration, data, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<Array<FollowUpAppointmentsResponse>>(
          await this.getApiUrl(integration, `/netris/api/atendimentos/retorno/${data.idPaciente}`),
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, data, methodName);
      if (error?.response?.data?.message.includes('ocupado')) {
        throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
      }
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
