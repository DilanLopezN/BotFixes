import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import * as contextService from 'request-context';
import * as moment from 'moment';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from '../../../../common/exceptions.service';
import { AuditService } from '../../../audit/services/audit.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import {
  AmigoApiResponse,
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
  AmigoOrganizationUnitItem,
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
    const credentials: AmigoCredentialsResponse =
      await this.credentialsHelper.getConfig<AmigoCredentialsResponse>(integration);
    const { baseUrl = 'https://api.amigocare.com.br/api-chatbot', apiToken } = credentials;
    return {
      baseUrl,
      params: { ...(params ?? {}), token: apiToken },
    };
  }

  private async setConfigAxiosV2(integration: IntegrationDocument, params?: ObjectInterface) {
    const credentials: AmigoCredentialsResponse =
      await this.credentialsHelper.getConfig<AmigoCredentialsResponse>(integration);
    const { baseUrl = 'https://amigobot-api.amigoapp.com.br', apiToken } = credentials;
    return {
      baseUrl,
      params: params ?? {},
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    };
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    params?: { user_id?: string; event_id?: string; insurance_id?: string },
    ignoreException?: boolean,
  ): Promise<AmigoOrganizationUnitsResponse['unidadesList']> {
    try {
      this.dispatchAuditEvent(integration, params, this.listOrganizationUnits.name, AuditDataType.externalRequest);
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoOrganizationUnitItem[]>>(`${baseUrl}/places`, reqConfig),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listOrganizationUnits.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.data ?? [];
      } else {
        const config = await this.setConfigAxios(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoOrganizationUnitsResponse>(`${baseUrl}/places`, reqConfig),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listOrganizationUnits.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.unidadesList ?? [];
      }
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
      this.dispatchAuditEvent(integration, params, this.listInsurances.name, AuditDataType.externalRequest);
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoInsurancesResponse['conveniosList']>>(
            `${baseUrl}/insurances`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(integration, request?.data, this.listInsurances.name, AuditDataType.externalResponse);
        return request?.data?.data ?? [];
      } else {
        const config = await this.setConfigAxios(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoInsurancesResponse>(`${baseUrl}/insurances`, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.listInsurances.name, AuditDataType.externalResponse);
        return request?.data?.conveniosList ?? [];
      }
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
      this.dispatchAuditEvent(integration, params, this.listInsurancePlans.name, AuditDataType.externalRequest);
      const { insuranceId, event_id, ...rest } = params;
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration, { event_id, ...rest });
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoInsurancePlansResponse['planosList']>>(
            `${baseUrl}/insurances/plans/${insuranceId || ''}`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listInsurancePlans.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.data ?? [];
      } else {
        const config = await this.setConfigAxios(integration, { event_id, ...rest });
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoInsurancePlansResponse>(
            `${baseUrl}/insurance-plans${insuranceId ? `/${insuranceId}` : ''}`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listInsurancePlans.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.planosList ?? [];
      }
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
      if (integration.rules?.useAmigoApiV2) {
        const newparams = { event_id: params.event_id };
        const config = await this.setConfigAxiosV2(integration, newparams);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoDoctorsResponse['medicosList']>>(
            `${baseUrl}/doctors/available`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(integration, request?.data, this.listDoctors.name, AuditDataType.externalResponse);
        return request?.data?.data ?? [];
      } else {
        const { specialty, ...newParams } = params;
        const config = await this.setConfigAxios(integration, newParams);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoDoctorsResponse>(`${baseUrl}/users-available`, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.listDoctors.name, AuditDataType.externalResponse);
        return request?.data?.medicosList ?? [];
      }
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
    params?: { insurance_id?: string },
    ignoreException?: boolean,
  ): Promise<AmigoSpecialitiesResponse['specialties']> {
    try {
      this.dispatchAuditEvent(integration, params, this.listSpecialities.name, AuditDataType.externalRequest);
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoSpecialitiesResponse['specialties']>>(
            `${baseUrl}/doctors/specialties`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(integration, request?.data, this.listSpecialities.name, AuditDataType.externalResponse);
        return request?.data?.data ?? [];
      } else {
        const config = await this.setConfigAxios(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoSpecialitiesResponse>(`${baseUrl}/specialties?`, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.listSpecialities.name, AuditDataType.externalResponse);
        return request?.data?.specialties ?? [];
      }
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
      this.dispatchAuditEvent(integration, params, this.listProcedures.name, AuditDataType.externalRequest);
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoProceduresResponse['eventsList']>>(`${baseUrl}/events`, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.listProcedures.name, AuditDataType.externalResponse);
        return request?.data?.data ?? [];
      } else {
        const config = await this.setConfigAxios(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoProceduresResponse>(`${baseUrl}/events?`, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.listProcedures.name, AuditDataType.externalResponse);
        return request?.data?.eventsList ?? [];
      }
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
      this.dispatchAuditEvent(integration, params, this.getPatient.name, AuditDataType.externalRequest);
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoGetPatientResponse['patient']>>(
            `${baseUrl}/patients/exists`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(integration, request?.data, this.getPatient.name, AuditDataType.externalResponse);
        return request?.data?.data ?? null;
      } else {
        const config = await this.setConfigAxios(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoGetPatientResponse>(`${baseUrl}/patient`, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.getPatient.name, AuditDataType.externalResponse);
        return request?.data?.patient ?? null;
      }
    } catch (error) {
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        return null;
      }
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
      this.dispatchAuditEvent(integration, params, this.createPatient.name, AuditDataType.externalRequest);
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration);
        const { baseUrl, ...reqConfig } = config;
        const bornFormatted = moment(params.born, 'DD/MM/YYYY', true).format('YYYY-MM-DD');
        const request = await lastValueFrom(
          this.httpService.post<AmigoApiResponse<AmigoPatientDefaultWithId>>(
            `${baseUrl}/patients`,
            { ...params, born: bornFormatted },
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(integration, request?.data, this.createPatient.name, AuditDataType.externalResponse);
        return request?.data?.data ?? null;
      } else {
        const config = await this.setConfigAxios(integration);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.post<AmigoCreatePatientResponse>(`${baseUrl}/patient`, params, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.createPatient.name, AuditDataType.externalResponse);
        return request?.data?.patient ?? null;
      }
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
      this.dispatchAuditEvent(integration, params, this.updatePatient.name, AuditDataType.externalRequest);
      const { id, ...payload } = params;
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.put<AmigoApiResponse<AmigoPatientDefaultWithId>>(
            `${baseUrl}/patients/${id}`,
            payload,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(integration, request?.data, this.updatePatient.name, AuditDataType.externalResponse);
        return request?.data?.data ?? null;
      } else {
        const config = await this.setConfigAxios(integration);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.put<AmigoPatientDefaultWithId>(`${baseUrl}/patient/${id}`, payload, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.updatePatient.name, AuditDataType.externalResponse);
        return request?.data ?? null;
      }
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
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoListAvailableSchedulerResponse['dates']>>(
            `${baseUrl}/calendar`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listAvailableScheduler.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.data ?? [];
      } else {
        const config = await this.setConfigAxios(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoListAvailableSchedulerResponse>(`${baseUrl}/user/dates-with-slots`, reqConfig),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listAvailableScheduler.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.dates ?? [];
      }
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
      const { userId, event_id, date, ...rest } = params;
      if (integration.rules?.useAmigoApiV2) {
        const dateFormatted = date ? moment(date, 'DD/MM/YYYY', true).format('YYYY-MM-DD') : undefined;
        const config = await this.setConfigAxiosV2(integration, { event_id, date: dateFormatted, ...rest });
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoListAvailableSchedulerByDoctorResponse['DatasList']>>(
            `${baseUrl}/doctors/${userId}/available-dates`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listAvailableSchedulerByDoctor.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.data ?? [];
      } else {
        const config = await this.setConfigAxios(integration, { event_id, date, ...rest });
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoListAvailableSchedulerByDoctorResponse>(
            `${baseUrl}/user/available-dates/${userId}`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listAvailableSchedulerByDoctor.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.DatasList ?? [];
      }
    } catch (error) {
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        return [];
      }
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
      this.dispatchAuditEvent(integration, params, this.listPatientSchedules.name, AuditDataType.externalRequest);
      const { patient_id, start_date, end_date } = params;
      if (integration.rules?.useAmigoApiV2) {
        const dateFormat = patient_id ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
        const config = await this.setConfigAxiosV2(integration, {
          start_date: start_date ? moment(start_date).format(dateFormat) : undefined,
          end_date: end_date ? moment(end_date).format(dateFormat) : undefined,
        });
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoApiResponse<AmigoPatientScheduleResponse['data']>>(
            `${baseUrl}/attendances${patient_id ? `/${patient_id}` : ''}`,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listPatientSchedules.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.data ?? [];
      } else {
        const config = await this.setConfigAxios(integration, params);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.get<AmigoPatientScheduleResponse>(`${baseUrl}/list-attendances`, reqConfig),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.listPatientSchedules.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.data;
      }
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
      const body = {
        event_id: params.event_id,
        user_id: params.user_id,
        place_id: params.place_id,
        start_date: moment(params.start_date).format('YYYY-MM-DD HH:mm'),
        patient_id: params.patient_id,
      };
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.post<AmigoApiResponse<AmigoCreateScheduleResponse>>(
            `${baseUrl}/attendances`,
            body,
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(integration, request?.data, this.createSchedule.name, AuditDataType.externalResponse);
        return request?.data?.data ?? null;
      } else {
        const config = await this.setConfigAxios(integration);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.post<AmigoCreateScheduleResponse>(`${baseUrl}/add-attendance`, params, reqConfig),
        );
        this.dispatchAuditEvent(integration, request?.data, this.createSchedule.name, AuditDataType.externalResponse);
        return request?.data ?? null;
      }
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
      const { status, patient_id, attendance_id } = params;
      if (integration.rules?.useAmigoApiV2) {
        const config = await this.setConfigAxiosV2(integration);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.put<AmigoApiResponse<AmigoStatusScheduleResponse>>(
            `${baseUrl}/attendances/${status}`,
            { patient_id, attendance_id },
            reqConfig,
          ),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.updateStatusSchedule.name,
          AuditDataType.externalResponse,
        );
        return request?.data?.data ?? null;
      } else {
        const { status: _status, ...payload } = params;
        const config = await this.setConfigAxios(integration);
        const { baseUrl, ...reqConfig } = config;
        const request = await lastValueFrom(
          this.httpService.put<AmigoStatusScheduleResponse>(`${baseUrl}/attendance/${status}`, payload, reqConfig),
        );
        this.dispatchAuditEvent(
          integration,
          request?.data,
          this.updateStatusSchedule.name,
          AuditDataType.externalResponse,
        );
        return request?.data ?? null;
      }
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
