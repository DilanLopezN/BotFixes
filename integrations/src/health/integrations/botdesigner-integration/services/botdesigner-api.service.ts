import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { lastValueFrom } from 'rxjs';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { CtxMetadata } from '../../../../common/interfaces/ctx-metadata';
import {
  botdesignerEconnresetCounter,
  botdesignerEconnresetResolvedCounter,
  requestsExternalCounter,
} from '../../../../common/prom-metrics';
import { AuditDataType } from '../../../audit/audit.interface';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationType } from '../../../interfaces/integration-types';
import {
  AvailableSchedule,
  CancelSchedule,
  ConfirmSchedule,
  DefaultResponse,
  DoctorEntity,
  InsuranceEntity,
  InsuranceCategoryEntity,
  InsurancePlanEntity,
  ListAvailableSchedulesFilters,
  ListDoctorsFilters,
  ListInsuranceCategoriesFilters,
  ProcedureEntity,
  SpecialityEntity,
  TypeOfServiceEntity,
  OccupationAreaEntity,
  OnDutyMedicalScale,
  Schedule,
  ListSchedulesFilters,
  ListInsurancePlansFilters,
  ListInsurancesFilters,
  OrganizationUnitEntity,
  ListOrganizationUnitsFilters,
  ListProceduresFilters,
  ListSpecialitiesFilters,
  Patient,
  GetPatientFilters,
  CreateScheduleResponse,
  CreateSchedule,
  CreatePatient,
  CreatePatientResponse,
  RescheduleResponse,
  Reschedule,
  ListPatientSchedulesFilters,
  PatientSchedule,
  ListTypesOfServiceFilters,
  UpdatePatient,
  UpdatePatientResponse,
  ListDoctorSchedulesParams,
  ListDoctorSchedulesResponse,
  FindDoctorParams,
  FindDoctorResponse,
  CreateScheduleExam,
  CreateScheduleExamResponse,
  ListOccupationAreaFilters,
  OrganizationUnitLocationEntity,
  ListOrganizationUnitLocationsFilters,
  ScheduledSendingFilter,
  ScheduledSendingConfirmation,
  ListInsuranceSubPlansFilters,
  InsuranceSubPlanEntity,
  ScheduledSending,
  GetScheduleValue,
  GetScheduleValueResponse,
  RecoverAccessProtocolRequest,
  RecoverAccessProtocolResponse,
  UpdateReportSending,
  ListReportSending,
  GetReportSendingUrl,
  GetReportSendingResponseUrl,
  ListSuggestedDoctorsFilters,
  SuggestedDoctorEntity,
  RescheduleExam,
  RescheduleExamResponse,
  ReportSending,
  ListFileTypesResponse,
  PatientUploadScheduleFileResponse,
  PatientUploadScheduleFile,
  AgentUploadScheduleFileResponse,
  AgentUploadScheduleFile,
  AgentDeleteScheduleFileResponse,
  AgentDeleteScheduleFile,
  PatientDeleteScheduleFileResponse,
  PatientDeleteScheduleFile,
  ListLateralitiesFilters,
  LateralityEntity,
  PatientScheduleToUploadFile,
  ListPatientSchedulesToUploadFileFilters,
} from 'kissbot-health-core';
import { FutureSchedule, ListFutureSchedulesParams } from '../../../integrator/interfaces/future-schedules.interface';
import { OkResponse } from '../interface/ok-response';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { BotDesignerCredentialsResponse } from '../interface/credentials';
import { orderBy } from 'lodash';
import { cleanseObject } from '../../../../common/helpers/cleanse-object';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class BotdesignerApiService {
  public constructor(
    private readonly httpService: HttpService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(function (config) {
      const metadata: CtxMetadata = contextService.get('req:default-headers');
      config.headers['request-ctx-id'] = metadata?.ctxId;

      try {
        requestsExternalCounter.labels(IntegrationType.BOTDESIGNER).inc();
      } catch (error) {}

      return config;
    });

    const httpServiceRef = this.httpService;

    this.httpService.axiosRef.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        if (config._retry) {
          return Promise.reject(error);
        }

        if (
          error?.code === 'ECONNRESET' ||
          error?.cause?.code === 'ECONNRESET' ||
          error?.response?.data?.error?.code === 'ECONNRESET'
        ) {
          config._retry = true;

          try {
            botdesignerEconnresetCounter.labels().inc();
          } catch (error) {}

          try {
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            const response = await httpServiceRef.axiosRef(config);

            try {
              botdesignerEconnresetResolvedCounter.labels().inc();
            } catch (error) {}

            return response;
          } catch (retryError) {
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private async getDefaultHeaders(integration: IntegrationDocument) {
    if (process.env.NODE_ENV === 'local' && process.env.DEBUG_BOTDESIGNER_TOKEN) {
      return {
        Authorization: `Bearer ${process.env.DEBUG_BOTDESIGNER_TOKEN}`,
      };
    }

    const config = await this.credentialsHelper.getConfig<BotDesignerCredentialsResponse>(integration);

    if (!config) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.INTERNAL_SERVER_ERROR,
        { message: 'Invalid integration config' },
        HttpErrorOrigin.INTEGRATION_ERROR,
        false,
        undefined,
      );
    }

    const { apiToken } = config;

    if (!apiToken) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.INTERNAL_SERVER_ERROR,
        { message: 'Invalid api token' },
        HttpErrorOrigin.INTEGRATION_ERROR,
        false,
        undefined,
      );
    }

    return {
      Authorization: `Bearer ${apiToken}`,
    };
  }

  private async getApiUrl(integration: IntegrationDocument): Promise<string> {
    if (process.env.NODE_ENV === 'local' && process.env.DEBUG_BOTDESIGNER_URL) {
      return process.env.DEBUG_BOTDESIGNER_URL;
    }

    const config = await this.credentialsHelper.getConfig<BotDesignerCredentialsResponse>(integration);

    if (!config) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.INTERNAL_SERVER_ERROR,
        { message: `invalid integration config: ${integration._id}` },
        HttpErrorOrigin.INTEGRATION_ERROR,
        false,
        undefined,
      );
    }

    const { apiUrl } = config;

    if (!apiUrl) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.INTERNAL_SERVER_ERROR,
        { message: `invalid api url: ${integration._id}` },
        HttpErrorOrigin.INTEGRATION_ERROR,
        false,
        undefined,
      );
    }

    return apiUrl;
  }

  private getIntegrationId(integration: IntegrationDocument): string {
    if (process.env.NODE_ENV === 'local' && process.env.DEBUG_BOTDESIGNER_INTEGRATION_ID) {
      return process.env.DEBUG_BOTDESIGNER_INTEGRATION_ID;
    }

    return castObjectIdToString(integration._id);
  }

  private handleResponseException(
    integration: IntegrationDocument,
    error: any,
    payload: any,
    from: string,
    ignoreException = false,
  ) {
    const metadata: CtxMetadata = contextService.get('req:default-headers');

    this.auditService.sendAuditEvent({
      dataType: AuditDataType.externalResponse,
      integrationId: castObjectIdToString(integration._id),
      data: {
        data: error?.response,
      },
      identifier: from,
    });

    if (error && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:BOTDESIGNER-request: ${from}`,
        user: {
          id: metadata?.memberId,
          username: metadata?.conversationId,
        },
        extra: {
          payload: JSON.stringify(payload),
          error: error?.response ?? error,
          metadata: {
            cvId: metadata?.conversationId,
            wsId: metadata?.workspaceId,
            mbId: metadata?.memberId,
          },
        },
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

  private throwIntegrationError(
    integration: IntegrationDocument,
    error: any,
    methodName: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    throw HTTP_ERROR_THROWER(statusCode, error, HttpErrorOrigin.INTEGRATION_ERROR, false, undefined, {
      location: `BotdesignerApiService.${methodName}`,
      integrationId: castObjectIdToString(integration._id),
      workspaceId: castObjectIdToString(integration.workspaceId),
    });
  }

  public async listOnDutyMedicalScale(integration: IntegrationDocument): Promise<OnDutyMedicalScale[]> {
    const methodName = 'listOnDutyMedicalScale';

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OnDutyMedicalScale[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/listOnDutyMedicalScale`,
          undefined,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, {}, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listAvailableSchedules(
    integration: IntegrationDocument,
    payload: ListAvailableSchedulesFilters,
  ): Promise<AvailableSchedule[]> {
    const methodName = 'listAvailableSchedules';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<AvailableSchedule[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/listAvailableSchedules`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listSchedules(integration: IntegrationDocument, payload: ListSchedulesFilters): Promise<Schedule[]> {
    const methodName = 'listSchedules';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<Schedule[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/listSchedules`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listDoctors(integration: IntegrationDocument, payload: ListDoctorsFilters): Promise<DoctorEntity[]> {
    const methodName = 'listDoctors';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<DoctorEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listDoctors`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listDoctorSchedules(
    integration: IntegrationDocument,
    payload: ListDoctorSchedulesParams,
  ): Promise<ListDoctorSchedulesResponse[]> {
    const methodName = 'listDoctorSchedules';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<ListDoctorSchedulesResponse[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/doctors/listDoctorSchedules`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async findDoctor(integration: IntegrationDocument, payload: FindDoctorParams): Promise<FindDoctorResponse> {
    const methodName = 'findDoctor';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<FindDoctorResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/doctors/findDoctor`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listInsuranceCategories(
    integration: IntegrationDocument,
    payload: ListInsuranceCategoriesFilters,
  ): Promise<InsuranceCategoryEntity[]> {
    const methodName = 'listInsuranceCategories';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<InsuranceCategoryEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listInsuranceCategories`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    payload: ListInsurancePlansFilters,
  ): Promise<InsurancePlanEntity[]> {
    const methodName = 'listInsurancePlans';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<InsurancePlanEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listInsurancePlans`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, {}, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listInsuranceSubPlans(
    integration: IntegrationDocument,
    payload: ListInsuranceSubPlansFilters,
  ): Promise<InsuranceSubPlanEntity[]> {
    const methodName = 'listInsuranceSubPlans';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<InsuranceSubPlanEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listInsuranceSubPlans`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, {}, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    payload: ListInsurancesFilters,
    ignoreException?: boolean,
  ): Promise<InsuranceEntity[]> {
    const methodName = 'listInsurances';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<InsuranceEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listInsurances`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName, ignoreException);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    payload: ListOrganizationUnitsFilters,
    ignoreException?: boolean,
  ): Promise<OrganizationUnitEntity[]> {
    const methodName = 'listOrganizationUnits';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OrganizationUnitEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listOrganizationUnits`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName, ignoreException);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    payload: ListProceduresFilters,
  ): Promise<ProcedureEntity[]> {
    const methodName = 'listProcedures';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<ProcedureEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listProcedures`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    payload: ListSpecialitiesFilters,
  ): Promise<SpecialityEntity[]> {
    const methodName = 'listSpecialities';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<SpecialityEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listSpecialities`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listLateralities(
    integration: IntegrationDocument,
    payload: ListLateralitiesFilters,
  ): Promise<LateralityEntity[]> {
    const methodName = this.listLateralities.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<SpecialityEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listLateralities`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async confirmSchedule(integration: IntegrationDocument, payload: ConfirmSchedule): Promise<OkResponse> {
    const methodName = 'confirmSchedule';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);
      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OkResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/confirmSchedule`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      this.handleResponseException(integration, error, {}, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async cancelSchedule(integration: IntegrationDocument, payload: CancelSchedule): Promise<OkResponse> {
    const methodName = 'cancelSchedule';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);
      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OkResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/cancelSchedule`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async getPatient(integration: IntegrationDocument, payload: GetPatientFilters): Promise<Patient> {
    const methodName = 'getPatient';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<Patient>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/patient/getPatient`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async createScheduleExam(
    integration: IntegrationDocument,
    payload: CreateScheduleExam,
  ): Promise<CreateScheduleExamResponse> {
    const methodName = 'createScheduleExam';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<CreateScheduleExamResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/createScheduleExam`,
          payload,
          {
            headers,
          },
        ),
      );

      if (response?.data?.statusCode === HttpStatus.CONFLICT) {
        this.throwIntegrationError(integration, 'Filled schedule', methodName, HttpStatus.CONFLICT);
      }

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      if (error?.response?.status === HttpStatus.CONFLICT) {
        this.throwIntegrationError(integration, 'Filled schedule', methodName, HttpStatus.CONFLICT);
      }

      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    payload: CreateSchedule,
  ): Promise<CreateScheduleResponse> {
    const methodName = 'createSchedule';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<CreateScheduleResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/createSchedule`,
          payload,
          {
            headers,
          },
        ),
      );

      if (response?.data?.statusCode === HttpStatus.BAD_REQUEST) {
        this.throwIntegrationError(
          integration,
          response?.data.error || 'Error creating schedule',
          methodName,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (response?.data?.statusCode === HttpStatus.CONFLICT) {
        this.throwIntegrationError(integration, 'Filled schedule', methodName, HttpStatus.CONFLICT);
      }

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      if (error?.response?.status === HttpStatus.CONFLICT) {
        this.throwIntegrationError(integration, 'Filled schedule', methodName, HttpStatus.CONFLICT);
      }

      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async reschedule(integration: IntegrationDocument, payload: Reschedule): Promise<RescheduleResponse> {
    const methodName = 'reschedule';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<RescheduleResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/reschedule`,
          payload,
          {
            headers,
          },
        ),
      );

      if (response?.data?.statusCode === HttpStatus.CONFLICT) {
        this.throwIntegrationError(integration, 'Filled schedule', methodName, HttpStatus.CONFLICT);
      }

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      if (error?.response?.status === HttpStatus.CONFLICT) {
        this.throwIntegrationError(integration, 'Filled schedule', methodName, HttpStatus.CONFLICT);
      }

      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async rescheduleExam(
    integration: IntegrationDocument,
    payload: RescheduleExam,
  ): Promise<RescheduleExamResponse> {
    const methodName = 'rescheduleExam';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<RescheduleResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/rescheduleExam`,
          payload,
          {
            headers,
          },
        ),
      );

      if (response?.data?.statusCode === HttpStatus.CONFLICT) {
        this.throwIntegrationError(integration, 'Filled schedule', methodName, HttpStatus.CONFLICT);
      }

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      if (error?.response?.status === HttpStatus.CONFLICT) {
        this.throwIntegrationError(integration, 'Filled schedule', methodName, HttpStatus.CONFLICT);
      }

      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async createPatient(integration: IntegrationDocument, payload: CreatePatient): Promise<CreatePatientResponse> {
    const methodName = 'createPatient';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<CreatePatientResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/patient/createPatient`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async updatePatient(integration: IntegrationDocument, payload: UpdatePatient): Promise<UpdatePatientResponse> {
    const methodName = 'updatePatient';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<CreatePatientResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/patient/updatePatient`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listPatientSchedules(
    integration: IntegrationDocument,
    payload: ListPatientSchedulesFilters,
  ): Promise<PatientSchedule[]> {
    const methodName = 'listPatientSchedules';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<PatientSchedule[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/patient/listSchedules`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return orderBy(response.data?.data ?? [], 'scheduleDate', 'asc');
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listPatientSchedulesToUploadFile(
    integration: IntegrationDocument,
    payload: ListPatientSchedulesToUploadFileFilters,
  ): Promise<PatientScheduleToUploadFile[]> {
    const methodName = 'listPatientSchedulesToUploadFile';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<PatientScheduleToUploadFile[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/files/listPatientSchedulesToUploadFile`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return orderBy(response.data?.data ?? [], 'scheduleDate', 'asc');
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listTypesOfService(
    integration: IntegrationDocument,
    payload: ListTypesOfServiceFilters,
  ): Promise<TypeOfServiceEntity[]> {
    const methodName = 'listTypesOfService';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<TypeOfServiceEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listTypesOfService`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listOccupationAreas(
    integration: IntegrationDocument,
    payload: ListOccupationAreaFilters,
  ): Promise<OccupationAreaEntity[]> {
    const methodName = 'listOccupationAreas';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OccupationAreaEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listOccupationAreas`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listOrganizationUnitLocations(
    integration: IntegrationDocument,
    payload: ListOrganizationUnitLocationsFilters,
  ): Promise<OrganizationUnitLocationEntity[]> {
    const methodName = 'listOrganizationUnitLocations';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OrganizationUnitLocationEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listOrganizationUnitLocations`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? [];
    } catch (error) {
      console.log(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listScheduledSending(
    integration: IntegrationDocument,
    payload: ScheduledSendingFilter,
  ): Promise<ScheduledSending[]> {
    const methodName = this.listScheduledSending.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<ScheduledSending[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/scheduled-sending/listScheduledSending`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data?.data ?? [];
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async executeScheduledSendingLoader(integration: IntegrationDocument): Promise<ScheduledSending[]> {
    const methodName = this.listScheduledSending.name;
    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, undefined, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.get<DefaultResponse<ScheduledSending[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/scheduled-sending/executeScheduledSendingLoader`,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data?.data ?? [];
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, undefined, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async updateScheduledSending(
    integration: IntegrationDocument,
    payload: ScheduledSendingConfirmation,
  ): Promise<OkResponse> {
    const methodName = this.updateScheduledSending.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OkResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/scheduled-sending/updateScheduledSending`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return { ok: true };
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async getScheduleValue(
    integration: IntegrationDocument,
    payload: GetScheduleValue,
  ): Promise<GetScheduleValueResponse> {
    const methodName = 'getScheduleValue';

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<GetScheduleValueResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/getScheduleValue`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      console.log(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async recoverAccessProtocol(
    integration: IntegrationDocument,
    payload: RecoverAccessProtocolRequest,
  ): Promise<RecoverAccessProtocolResponse> {
    const methodName = this.recoverAccessProtocol.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<RecoverAccessProtocolResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/access-protocol/recoverAccessProtocol`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data?.data ?? null;
    } catch (error) {
      console.log(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async updateReportSending(
    integration: IntegrationDocument,
    payload: UpdateReportSending,
  ): Promise<OkResponse> {
    const methodName = this.updateReportSending.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OkResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/report-sending/updateReportSending`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return { ok: true };
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listReportSending(
    integration: IntegrationDocument,
    payload: ListReportSending,
  ): Promise<ReportSending[]> {
    const methodName = this.listReportSending.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<ReportSending[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/report-sending/listReportSending`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async getReportSendingUrl(
    integration: IntegrationDocument,
    payload: GetReportSendingUrl,
  ): Promise<GetReportSendingResponseUrl> {
    const methodName = this.getReportSendingUrl.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<GetReportSendingResponseUrl>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/report-sending/getReportSendingUrl`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async downloadS3File(integration: IntegrationDocument, url: string): Promise<Readable> {
    const methodName = this.downloadS3File.name;
    try {
      this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(this.httpService.get<any>(url, { responseType: 'stream' }));

      this.dispatchAuditEvent(integration, { message: 'Stream received' }, methodName, AuditDataType.externalResponse);

      const stream = response.data as Readable;

      stream.on('error', (error) => {
        console.error(`Stream error in ${methodName}:`, error);
      });

      return stream;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, {}, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listSuggestedDoctors(
    integration: IntegrationDocument,
    payload: ListSuggestedDoctorsFilters,
  ): Promise<SuggestedDoctorEntity[]> {
    const methodName = this.listSuggestedDoctors.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<SuggestedDoctorEntity[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/entities/listSuggestedDoctors`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listFileTypesToUpload(integration: IntegrationDocument): Promise<ListFileTypesResponse> {
    const methodName = this.listFileTypesToUpload.name;

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, null, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<ListFileTypesResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/files/listFileTypesToUpload`,
          undefined,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, null, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async patientUploadScheduleFile(
    integration: IntegrationDocument,
    payload: PatientUploadScheduleFile,
  ): Promise<PatientUploadScheduleFileResponse> {
    const methodName = this.patientUploadScheduleFile.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<PatientUploadScheduleFileResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/files/patientUploadScheduleFile`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async agentUploadScheduleFile(
    integration: IntegrationDocument,
    payload: AgentUploadScheduleFile,
  ): Promise<AgentUploadScheduleFileResponse> {
    const methodName = this.agentUploadScheduleFile.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<AgentUploadScheduleFileResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/files/agentUploadScheduleFile`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async agentDeleteScheduleFile(
    integration: IntegrationDocument,
    payload: AgentDeleteScheduleFile,
  ): Promise<AgentDeleteScheduleFileResponse> {
    const methodName = this.agentDeleteScheduleFile.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<AgentDeleteScheduleFileResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/files/agentDeleteScheduleFile`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async patientDeleteScheduleFile(
    integration: IntegrationDocument,
    payload: PatientDeleteScheduleFile,
  ): Promise<PatientDeleteScheduleFileResponse> {
    const methodName = this.patientDeleteScheduleFile.name;

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<PatientDeleteScheduleFileResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/files/patientDeleteScheduleFile`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async sendAuthorizationInsuranceData(
    integration: IntegrationDocument,
    payload: { type: string; data: any },
  ): Promise<OkResponse> {
    const methodName = this.sendAuthorizationInsuranceData.name;
    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<OkResponse>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/authorization/sendAuthorizationInsuranceData`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data.data;
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }

  public async listFutureSchedules(
    integration: IntegrationDocument,
    params: ListFutureSchedulesParams,
  ): Promise<FutureSchedule[]> {
    const methodName = this.listFutureSchedules.name;

    let payload = cleanseObject(params);

    try {
      const headers = await this.getDefaultHeaders(integration);
      const apiUrl = await this.getApiUrl(integration);

      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.post<DefaultResponse<FutureSchedule[]>>(
          `${apiUrl}/integrator/${this.getIntegrationId(integration)}/listFutureSchedules`,
          payload,
          {
            headers,
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return (response.data?.data || []) as FutureSchedule[];
    } catch (error) {
      console.error(error);
      this.handleResponseException(integration, error, payload, methodName);
      this.throwIntegrationError(integration, error, methodName);
    }
  }
}
