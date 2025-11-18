import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import * as contextService from 'request-context';
import * as Sentry from '@sentry/node';
import { lastValueFrom } from 'rxjs';
import {
  ClinicAuthResponse,
  ClinicAvailableSchedule,
  ClinicCancelSchedule,
  ClinicConfirmSchedule,
  ClinicConsultationTypesResponse,
  ClinicCreatePatient,
  ClinicCreatePatientResponse,
  ClinicCreateScheduleData,
  ClinicCreateSchedulePayload,
  ClinicCreateScheduleResponse,
  ClinicDoctorParamsRequest,
  ClinicDoctorResponse,
  ClinicDoctorSpecialityDataRequest,
  ClinicDoctorSpecialityResponse,
  ClinicInsuranceResponse,
  ClinicListAvailableScheduleData,
  ClinicListAvailableScheduleParams,
  ClinicListSchedulesParams,
  ClinicOrganizationUnitAddressResponse,
  ClinicOrganizationUnitResponse,
  ClinicPatientParams,
  ClinicPatientResponse,
  ClinicResponse,
  ClinicResponseArray,
  ClinicSchedule,
  ClinicSinglePatientResponse,
  ClinicSpecialitiesParamsRequest,
  ClinicSpecialitiesResponse,
} from '../interfaces';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { AxiosRequestConfig } from 'axios';
import { PUBLIC_TOKEN_CACHE_EXPIRATION } from '../defaults';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { ClinicCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class ClinicApiService {
  private logger = new Logger(ClinicApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.CLINIC).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  private debugRequest(integration: IntegrationDocument, payload: any, _: string) {
    if (!integration.debug) {
      return;
    }

    this.logger.debug(`${integration._id}:${integration.name}:${IntegrationType.CLINIC}-debug`, payload);
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
        message: `${integration._id}:${integration.name}:${IntegrationType.CLINIC}-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private async getApiUrl(integration: IntegrationDocument, url: string): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<ClinicCredentialsResponse>(integration);
    return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  private async getDefaultConfig(integration: IntegrationDocument): Promise<Pick<AxiosRequestConfig, 'headers'>> {
    let defaultToken = undefined;
    const response = await this.defaultAuth(integration);

    if (response?.access_token) {
      await this.integrationCacheUtilsService.setPublicTokenCache(
        integration,
        response.access_token,
        PUBLIC_TOKEN_CACHE_EXPIRATION,
      );

      defaultToken = response.access_token;
    } else {
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Cannot authenticate', HttpErrorOrigin.INTEGRATION_ERROR);
    }

    return {
      headers: {
        Authorization: `Bearer ${defaultToken}`,
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

  public async defaultAuth(integration: IntegrationDocument): Promise<ClinicAuthResponse> {
    const funcName = this.defaultAuth.name;
    this.debugRequest(integration, null, funcName);

    const { apiUsername: username, apiPassword: password } =
      await this.credentialsHelper.getConfig<ClinicCredentialsResponse>(integration);

    if (!username || !password) {
      throw HTTP_ERROR_THROWER(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post<ClinicAuthResponse>(await this.getApiUrl(integration, '/oauth/v1/token'), undefined, {
          auth: {
            username,
            password,
          },
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatient(
    integration: IntegrationDocument,
    params: ClinicPatientParams,
  ): Promise<ClinicResponseArray<ClinicPatientResponse>> {
    this.debugRequest(integration, params, this.getPatient.name);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, '/api/v1/integration/facilities/1/patients');
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponseArray<ClinicPatientResponse>>(apiUrl, {
          ...config,
          params,
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'getPatient');
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getSinglePatient(
    integration: IntegrationDocument,
    patientCode: string,
  ): Promise<ClinicResponse<ClinicSinglePatientResponse>> {
    this.debugRequest(integration, { patientCode }, this.getPatient.name);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, `/api/v1/integration/facilities/1/patients/${patientCode}`);
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponse<ClinicSinglePatientResponse>>(apiUrl, {
          ...config,
          params: {
            returnAttendedBy: 1,
          },
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'getSinglePatient');
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: ClinicCreatePatient,
  ): Promise<ClinicResponse<ClinicCreatePatientResponse>> {
    const funcName = this.createPatient.name;
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, '/api/v1/integration/facilities/1/patients');
      const response = await lastValueFrom(
        this.httpService.post<ClinicResponse<ClinicCreatePatientResponse>>(apiUrl, payload, config),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async confirmSchedule(
    integration: IntegrationDocument,
    data: ClinicConfirmSchedule,
  ): Promise<ClinicResponse<void>> {
    const funcName = this.confirmSchedule.name;
    this.debugRequest(integration, data, funcName);
    this.dispatchAuditEvent(integration, data, funcName, AuditDataType.externalRequest);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(
        integration,
        `/api/v1/integration/facilities/1/doctors/1/addresses/1/bookings/${data.scheduleCode}/confirmation`,
      );
      const response = await lastValueFrom(
        this.httpService.patch<ClinicResponse<void>>(apiUrl, undefined, {
          ...config,
          params: {
            status: 'confirmed',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, data, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * Deleta o agendamento da base
   * É diferente da função updateToCanceledSchedule atualiza o agendamento para 'paciente desmarcou'
   * @param integration
   * @param data
   * @returns
   */
  public async cancelSchedule(
    integration: IntegrationDocument,
    data: ClinicCancelSchedule,
  ): Promise<ClinicResponse<void>> {
    const funcName = this.cancelSchedule.name;
    this.debugRequest(integration, data, funcName);
    this.dispatchAuditEvent(integration, data, funcName, AuditDataType.externalRequest);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(
        integration,
        `/api/v1/integration/facilities/1/doctors/1/addresses/1/bookings/${data.scheduleCode}`,
      );
      const response = await lastValueFrom(
        this.httpService.delete<ClinicResponse<void>>(apiUrl, {
          ...config,
          params: {
            external_id: 1,
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, data, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  /**
   * Atualiza o agendamento para 'paciente desmarcou'
   * É diferente da função cancelSchedule que deleta o agendamento da base
   * @param integration
   * @param data
   * @returns
   */
  public async updateToCanceledSchedule(
    integration: IntegrationDocument,
    data: ClinicCancelSchedule,
  ): Promise<ClinicResponse<void>> {
    const funcName = this.updateToCanceledSchedule.name;
    this.debugRequest(integration, data, funcName);
    this.dispatchAuditEvent(integration, data, funcName, AuditDataType.externalRequest);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(
        integration,
        `/api/v1/integration/facilities/1/doctors/1/addresses/1/bookings/${data.scheduleCode}/status`,
      );
      const response = await lastValueFrom(
        this.httpService.patch<ClinicResponse<void>>(apiUrl, undefined, {
          ...config,
          params: {
            value: 'canceled',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, data, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurances(integration: IntegrationDocument): Promise<ClinicResponseArray<ClinicInsuranceResponse>> {
    const funcName = this.listInsurances.name;
    this.debugRequest(integration, null, funcName);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, '/api/v1/integration/insurance-providers');
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponseArray<ClinicInsuranceResponse>>(apiUrl, config),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    ignoreException?: boolean,
  ): Promise<ClinicResponseArray<ClinicOrganizationUnitResponse>> {
    const funcName = this.listOrganizationUnits.name;
    this.debugRequest(integration, null, funcName);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, '/api/v1/integration/facilities');
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponseArray<ClinicOrganizationUnitResponse>>(apiUrl, config),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName, ignoreException);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    params: ClinicDoctorParamsRequest,
  ): Promise<ClinicResponseArray<ClinicDoctorResponse>> {
    const funcName = this.listDoctors.name;
    this.debugRequest(integration, null, funcName);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, '/api/v1/integration/facilities/1/doctors');
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponseArray<ClinicDoctorResponse>>(apiUrl, {
          ...config,
          params,
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSpecialities(
    integration: IntegrationDocument,
    params: ClinicSpecialitiesParamsRequest,
  ): Promise<ClinicResponseArray<ClinicSpecialitiesResponse>> {
    const funcName = this.listSpecialities.name;
    this.debugRequest(integration, null, funcName);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, '/api/v1/integration/specialties');
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponseArray<ClinicSpecialitiesResponse>>(apiUrl, {
          ...config,
          params,
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableSchedules(
    integration: IntegrationDocument,
    params: ClinicListAvailableScheduleParams,
    data: ClinicListAvailableScheduleData,
  ): Promise<ClinicResponseArray<ClinicAvailableSchedule>> {
    const funcName = this.listAvailableSchedules.name;
    this.debugRequest(integration, null, funcName);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(
        integration,
        `/api/v1/integration/facilities/${data.facility_id}/doctors/${data.doctor_id}/addresses/${data.address_id}/available-slots`,
      );
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponseArray<ClinicAvailableSchedule>>(apiUrl, {
          ...config,
          params,
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    payload: ClinicCreateSchedulePayload,
    data: ClinicCreateScheduleData,
  ): Promise<ClinicResponse<ClinicCreateScheduleResponse>> {
    const funcName = this.createSchedule.name;
    this.debugRequest(integration, null, funcName);
    this.dispatchAuditEvent(integration, data, funcName, AuditDataType.externalRequest);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(
        integration,
        `/api/v1/integration/facilities/${data.facility_id}/doctors/${data.doctor_id}/addresses/${data.address_id}/slots/${data.slot_start}`,
      );
      const response = await lastValueFrom(
        this.httpService.post<ClinicResponse<ClinicCreateScheduleResponse>>(apiUrl, payload, config),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listSchedules(
    integration: IntegrationDocument,
    params: ClinicListSchedulesParams,
  ): Promise<ClinicResponseArray<ClinicSchedule>> {
    const funcName = this.listSchedules.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);
    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(
        integration,
        '/api/v1/integration/facilities/1/doctors/0/addresses/1/bookings',
      );
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponseArray<ClinicSchedule>>(apiUrl, {
          ...config,
          params,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getOneSchedule(
    integration: IntegrationDocument,
    params: { booking_id: string },
  ): Promise<ClinicResponse<ClinicSchedule>> {
    const funcName = this.getOneSchedule.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);
    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(
        integration,
        `/api/v1/integration/facilities/1/doctors/0/addresses/1/bookings/${params.booking_id}`,
      );
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponse<ClinicSchedule>>(apiUrl, {
          ...config,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, funcName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getDoctor(
    integration: IntegrationDocument,
    data: ClinicDoctorSpecialityDataRequest,
  ): Promise<ClinicResponse<ClinicDoctorSpecialityResponse>> {
    const funcName = this.getDoctor.name;
    this.debugRequest(integration, null, funcName);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, `/api/v1/integration/facilities/1/doctors/${data.doctorCode}`);
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponse<ClinicDoctorSpecialityResponse>>(apiUrl, config),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listOrganizationUnitAddress(
    integration: IntegrationDocument,
  ): Promise<ClinicResponse<ClinicOrganizationUnitAddressResponse>> {
    const funcName = this.listOrganizationUnitAddress.name;
    this.debugRequest(integration, null, funcName);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(integration, '/api/v1/integration/facilities/1/doctors/1/addresses/1');
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponse<ClinicOrganizationUnitAddressResponse>>(apiUrl, config),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listConsultationTypes(
    integration: IntegrationDocument,
  ): Promise<ClinicResponseArray<ClinicConsultationTypesResponse>> {
    const funcName = this.listConsultationTypes.name;
    this.debugRequest(integration, null, funcName);

    try {
      const config = await this.getDefaultConfig(integration);
      const apiUrl = await this.getApiUrl(
        integration,
        '/dictionaries/v1/integration/facilities/1/dictionaries/consultation-types',
      );
      const response = await lastValueFrom(
        this.httpService.get<ClinicResponseArray<ClinicConsultationTypesResponse>>(apiUrl, config),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, null, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
