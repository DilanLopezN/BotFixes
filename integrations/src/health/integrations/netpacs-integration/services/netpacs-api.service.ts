import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
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

type ParamsType = { [key: string]: string | number | boolean };

@Injectable()
export class NetpacsApiService {
  private logger = new Logger(NetpacsApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
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

  private debugRequest(integration: IntegrationDocument, payload: any) {
    if (!integration.debug) {
      return;
    }

    this.logger.debug(`${integration._id}:${integration.name}:NETPACS-debug`, payload);
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

    if (error?.response?.data && !ignoreException) {
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
    this.debugRequest(integration, { code });

    try {
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
      this.handleResponseError(integration, error, { code }, 'getPatientByCode');
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
    this.debugRequest(integration, { cpf });

    try {
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
      this.handleResponseError(integration, error, { cpf }, 'getPatientByCpf');
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
    this.debugRequest(integration, payload);

    try {
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
    this.debugRequest(integration, params);

    try {
      const request = await lastValueFrom(
        this.httpService.get<BranchesResponse[]>(await this.getApiUrl(integration, '/netris/api/filiais'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getBranches');
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
    this.debugRequest(integration, params);

    try {
      const request = await lastValueFrom(
        this.httpService.get<UnitResponse[]>(await this.getApiUrl(integration, '/netris/api/unidades'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'listUnits', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedures(integration: IntegrationDocument, params?: ParamsType): Promise<ProceduresResponse[]> {
    this.debugRequest(integration, params);

    try {
      const request = await lastValueFrom(
        this.httpService.get<ProceduresResponse[]>(await this.getApiUrl(integration, '/netris/api/procedimentos'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getProcedures');
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
    this.debugRequest(integration, params);
    const { id_plano_convenio, ...otherParams } = params;

    try {
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
      this.handleResponseError(integration, error, params, 'getProcedures');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProcedure(integration: IntegrationDocument, procedureId: number): Promise<ProceduresResponse> {
    this.debugRequest(integration, { procedureId });

    try {
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
      this.handleResponseError(integration, error, { procedureId }, 'getProcedure');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getModalities(integration: IntegrationDocument, params?: ParamsType): Promise<ModalitiesResponse[]> {
    this.debugRequest(integration, params);

    try {
      const request = await lastValueFrom(
        this.httpService.get<ModalitiesResponse[]>(await this.getApiUrl(integration, '/netris/api/modalidades'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getModalities');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurances(integration: IntegrationDocument, params?: ParamsType): Promise<InsurancesResponse[]> {
    this.debugRequest(integration, params);

    try {
      const request = await lastValueFrom(
        this.httpService.get<InsurancesResponse[]>(await this.getApiUrl(integration, '/netris/api/convenios'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getInsurances');
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
    this.debugRequest(integration, params);

    try {
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
      this.handleResponseError(integration, error, params, 'getInsurancePlans');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getDoctors(integration: IntegrationDocument, params?: ParamsType): Promise<DoctorsResponse[]> {
    this.debugRequest(integration, params);

    try {
      const request = await lastValueFrom(
        this.httpService.get<DoctorsResponse[]>(await this.getApiUrl(integration, '/netris/api/medicos'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getDoctors');
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
    this.debugRequest(integration, params);

    try {
      const request = await lastValueFrom(
        this.httpService.get<ProfessionalsResponse[]>(await this.getApiUrl(integration, '/netris/api/profissionais'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getProfessionals');
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

    this.debugRequest(integration, params);
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
    this.debugRequest(integration, payload);

    try {
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
    this.debugRequest(integration, payload);
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
      this.handleResponseError(integration, error, { attendanceId, payload }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAttendance(integration: IntegrationDocument, attendanceId: string): Promise<AttendanceResponse> {
    this.debugRequest(integration, { attendanceId });

    try {
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
      this.handleResponseError(integration, error, { attendanceId }, 'getAttendance');
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
    this.debugRequest(integration, params);

    try {
      const request = await lastValueFrom(
        this.httpService.get<AttendanceResponse[]>(await this.getApiUrl(integration, '/netris/api/atendimentos'), {
          ...(await this.getHeaders(integration)),
          params,
        }),
      );

      return request?.data;
    } catch (error) {
      this.handleResponseError(integration, error, params, 'getAttendances');
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

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<CreateScheduleResponse>(
          await this.getApiUrl(integration, '/netris/api/horarios'),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, payload, methodName);
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

  public async updatePatient(
    integration: IntegrationDocument,
    payload: UpdatePatientRequest,
    patientCode: string,
  ): Promise<UpdatePacientResponse> {
    this.debugRequest(integration, payload);

    try {
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
    this.debugRequest(integration, params);

    try {
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
      this.handleResponseError(integration, error, params, 'listProceduresByDoctor');
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
    this.debugRequest(integration, params);
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
      this.handleResponseError(integration, error, params, 'listGroupedSchedules');
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
    this.debugRequest(integration, params);

    try {
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
      this.handleResponseError(integration, error, params, 'getProcedureValue');
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

    this.debugRequest(integration, data);
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
