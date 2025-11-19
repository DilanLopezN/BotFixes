import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { AuditService } from '../../../audit/services/audit.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import {
  AmigoCreatePatientResponse,
  AmigoCreateScheduleParamsRequest,
  AmigoCreateScheduleResponse,
  AmigoDoctorsParamsRequest,
  AmigoDoctorsResponse,
  AmigoGetPatientParamsRequest,
  AmigoGetPatientResponse,
  AmigoInsuranceParamsRequest,
  AmigoInsurancePlansParamsRequest,
  AmigoInsurancePlansResponse,
  AmigoInsurancesResponse,
  AmigoListAvailableSchedulerByDoctorParamsRequest,
  AmigoListAvailableSchedulerByDoctorResponse,
  AmigoListAvailableSchedulerParamsRequest,
  AmigoListAvailableSchedulerResponse,
  AmigoOrganizationUnitsResponse,
  AmigoPatientDefault,
  AmigoPatientDefaultWithId,
  AmigoPatientScheduleParamsRequest,
  AmigoPatientScheduleResponse,
  AmigoProceduresParamsRequest,
  AmigoProceduresResponse,
  AmigoSpecialitiesResponse,
  AmigoStatusScheduleParamsRequest,
  AmigoStatusScheduleResponse,
} from '../interfaces/base-register.interface';
import { ObjectInterface } from '../interfaces/default.interface';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { AmigoCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class AmigoApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly auditService: AuditService,
    private readonly errorHandlerService: SentryErrorHandlerService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.AMIGO).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
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
    ignoreException: boolean = false,
  ) {
    this.auditService.sendAuditEvent({
      dataType: AuditDataType.externalResponse,
      integrationId: castObjectIdToString(integration._id),
      data: {
        data: error?.response,
      },
      identifier: from,
    });

    if (error?.response?.data && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      const metadata = contextService.get('req:default-headers');
      Sentry.captureEvent({
        message: `${castObjectIdToString(integration._id)}:${integration.name}:AMIGO-request: ${from}`,
        ...this.errorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private async setConfigAxios(integration: IntegrationDocument, params?: ObjectInterface) {
    const { apiToken } = await this.credentialsHelper.getConfig<AmigoCredentialsResponse>(integration);

    return {
      params: {
        token: apiToken,
        ...params,
      },
    };
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    ignoreException?: boolean,
  ): Promise<AmigoOrganizationUnitsResponse['unidadesList']> {
    try {
      const request = await lastValueFrom(
        this.httpService.get<AmigoOrganizationUnitsResponse>('/places', await this.setConfigAxios(integration)),
      );
      return request?.data.unidadesList ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.listOrganizationUnits.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurances(
    integration: IntegrationDocument,
    params?: AmigoInsuranceParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoInsurancesResponse['conveniosList']> {
    try {
      const request = await lastValueFrom(
        this.httpService.get<AmigoInsurancesResponse>('/insurances', await this.setConfigAxios(integration, params)),
      );

      return request?.data.conveniosList ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, {}, this.listInsurances.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    params: AmigoInsurancePlansParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoInsurancePlansResponse['planosList']> {
    try {
      const { insuranceId, ...rest } = params;
      const request = await lastValueFrom(
        this.httpService.get<AmigoInsurancePlansResponse>(
          '/insurance-plans' + (!!insuranceId ? `/${insuranceId}` : ''),
          await this.setConfigAxios(integration, rest),
        ),
      );

      return request?.data.planosList ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, {}, this.listInsurancePlans.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    params: AmigoDoctorsParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoDoctorsResponse['medicosList']> {
    try {
      this.dispatchAuditEvent(integration, params, this.listDoctors.name, AuditDataType.externalRequest);
      const { specialty, ...newParams } = params;
      const request = await lastValueFrom(
        this.httpService.get<AmigoDoctorsResponse>(
          '/users-available?',
          await this.setConfigAxios(integration, newParams),
        ),
      );

      this.dispatchAuditEvent(integration, request?.data, this.listDoctors.name, AuditDataType.externalResponse);
      return request?.data.medicosList ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, {}, this.listDoctors.name, ignoreException);
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
  ): Promise<AmigoSpecialitiesResponse['specialties']> {
    try {
      const request = await lastValueFrom(
        this.httpService.get<AmigoSpecialitiesResponse>('/specialties?', await this.setConfigAxios(integration)),
      );
      return request?.data.specialties ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.listSpecialities.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listProcedures(
    integration: IntegrationDocument,
    params?: AmigoProceduresParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoProceduresResponse['eventsList']> {
    try {
      const request = await lastValueFrom(
        this.httpService.get<AmigoProceduresResponse>('/events?', await this.setConfigAxios(integration, params)),
      );
      return request?.data.eventsList ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.listProcedures.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatient(
    integration: IntegrationDocument,
    params: AmigoGetPatientParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoGetPatientResponse['patient']> {
    try {
      const request = await lastValueFrom(
        this.httpService.get<AmigoGetPatientResponse>('/patient', await this.setConfigAxios(integration, params)),
      );
      return request?.data.patient || null;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.getPatient.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    params: AmigoPatientDefault,
    ignoreException?: boolean,
  ): Promise<AmigoPatientDefaultWithId> {
    try {
      const request = await lastValueFrom(
        this.httpService.post<AmigoCreatePatientResponse>('/patient', params, await this.setConfigAxios(integration)),
      );
      return request?.data.patient || null;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.createPatient.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    params: AmigoPatientDefaultWithId,
    ignoreException?: boolean,
  ): Promise<AmigoPatientDefaultWithId> {
    try {
      const { id, ...payload } = params;
      const request = await lastValueFrom(
        this.httpService.put<AmigoPatientDefaultWithId>(
          `/patient/${id}`,
          payload,
          await this.setConfigAxios(integration),
        ),
      );
      return request?.data || null;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.updatePatient.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableScheduler(
    integration: IntegrationDocument,
    params: AmigoListAvailableSchedulerParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoListAvailableSchedulerResponse['dates']> {
    try {
      this.dispatchAuditEvent(integration, params, this.listAvailableScheduler.name, AuditDataType.externalRequest);
      const request = await lastValueFrom(
        this.httpService.get<AmigoListAvailableSchedulerResponse>(
          '/user/dates-with-slots',
          await this.setConfigAxios(integration, params),
        ),
      );
      this.dispatchAuditEvent(
        integration,
        request?.data,
        this.listAvailableScheduler.name,
        AuditDataType.externalResponse,
      );
      return request?.data.dates || [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.listAvailableScheduler.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableSchedulerByDoctor(
    integration: IntegrationDocument,
    params: AmigoListAvailableSchedulerByDoctorParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoListAvailableSchedulerByDoctorResponse['DatasList']> {
    try {
      this.dispatchAuditEvent(
        integration,
        params,
        this.listAvailableSchedulerByDoctor.name,
        AuditDataType.externalRequest,
      );
      const { userId, ...rest } = params;
      const request = await lastValueFrom(
        this.httpService.get<AmigoListAvailableSchedulerByDoctorResponse>(
          `/user/available-dates/${userId}`,
          await this.setConfigAxios(integration, rest),
        ),
      );

      this.dispatchAuditEvent(
        integration,
        request?.data,
        this.listAvailableSchedulerByDoctor.name,
        AuditDataType.externalResponse,
      );
      return request?.data.DatasList || [];
    } catch (error) {
      await this.handleResponseError(
        integration,
        error,
        undefined,
        this.listAvailableSchedulerByDoctor.name,
        ignoreException,
      );
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPatientSchedules(
    integration: IntegrationDocument,
    params: AmigoPatientScheduleParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoPatientScheduleResponse['data']> {
    try {
      const request = await lastValueFrom(
        this.httpService.get<AmigoPatientScheduleResponse>(
          '/list-attendances',
          await this.setConfigAxios(integration, params),
        ),
      );
      return request?.data.data;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.listPatientSchedules.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    params: AmigoCreateScheduleParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoCreateScheduleResponse> {
    try {
      this.dispatchAuditEvent(integration, params, this.createSchedule.name, AuditDataType.externalRequest);

      const request = await lastValueFrom(
        this.httpService.post<AmigoCreateScheduleResponse>(
          '/add-attendance',
          params,
          await this.setConfigAxios(integration),
        ),
      );
      this.dispatchAuditEvent(integration, request?.data, this.createSchedule.name, AuditDataType.externalRequest);
      return request?.data ?? null;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, this.createSchedule.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updateStatusSchedule(
    integration: IntegrationDocument,
    params: AmigoStatusScheduleParamsRequest,
    ignoreException?: boolean,
  ): Promise<AmigoStatusScheduleResponse> {
    try {
      this.dispatchAuditEvent(integration, params, this.updateStatusSchedule.name, AuditDataType.externalRequest);

      const { status, ...payload } = params;
      const request = await lastValueFrom(
        this.httpService.put<AmigoStatusScheduleResponse>(
          `/attendance/${status}`,
          payload,
          await this.setConfigAxios(integration),
        ),
      );
      this.dispatchAuditEvent(
        integration,
        request?.data,
        this.updateStatusSchedule.name,
        AuditDataType.externalResponse,
      );
      return request?.data ?? null;
    } catch (error) {
      if (error?.response?.data?.message === 'Não é possível confirmar um atendimento confirmado.') {
        return { data: true, status: 'ok' };
      }

      if (
        error?.response?.data?.message ===
        'Não é possível modificar o status de um atendimento finalizado, cancelado ou marcado como faltante.'
      ) {
        return { data: true, status: 'ok' };
      }

      await this.handleResponseError(integration, error, undefined, this.updateStatusSchedule.name, ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
