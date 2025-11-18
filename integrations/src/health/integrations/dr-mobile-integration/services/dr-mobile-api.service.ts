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
import { IntegrationType } from '../../../interfaces/integration-types';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import {
  DrMobileAuthParamsRequest,
  DrMobileAuthResponse,
  DrMobileAvailableSchedule,
  DrMobileAvailableSchedules,
  DrMobileAvailableSchedulesResponse,
  DrMobileCancelScheduleParams,
  DrMobileCancelScheduleResponse,
  DrMobileConfirmScheduleParams,
  DrMobileCreatePatienResponse,
  DrMobileCreatePatient,
  DrMobileCreateSchedule,
  DrMobileCreateScheduleResponse,
  DrMobileDoctor,
  DrMobileDoctorsByUnitParamsRequest,
  DrMobileDoctorsParamsRequest,
  DrMobileGetPatientRequest,
  DrMobileInsurancePlansParamsRequest,
  DrMobileInsurancePlansResponse,
  DrMobileInsuranceSubPlansParamsRequest,
  DrMobileInsuranceSubPlansResponse,
  DrMobileInsurancesResponse,
  DrMobileListSchedulesParams,
  DrMobileOrganizationUnit,
  DrMobileOrganizationUnitsParamsRequest,
  DrMobileOrganizationUnitsResponse,
  DrMobilePatient,
  DrMobilePatientSchedules,
  DrMobilePatientSchedulesAxiosResponse,
  DrMobilePatientSchedulesResponse,
  DrMobileProceduresParamsRequest,
  DrMobileProceduresResponse,
  DrMobileScheduleConfirmation,
  DrMobileSpecialitiesResponse,
  DrMobileSpeciality,
} from '../interfaces';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { DrMobileCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

@Injectable()
export class DrMobileApiService {
  private readonly logger = new Logger(DrMobileApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.DR_MOBILE).inc();
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
    ignoreException = false,
  ) {
    if (payload?.password) {
      payload.password = undefined;
    }

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
        message: `${integration._id}:${integration.name}:DR_MOBILE-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private debugRequest(integration: IntegrationDocument, payload: any) {
    if (!integration.debug) {
      return;
    }

    this.logger.debug(`${integration._id}:${integration.name}:DR_MOBILE-debug`, payload);
  }

  private async getDefaultAuthPayload(integration: IntegrationDocument): Promise<DrMobileAuthParamsRequest> {
    const { apiUsername: username, apiPassword: password } =
      await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    return {
      senha: password,
      email: username,
    };
  }

  public async defaultAuth(integration: IntegrationDocument): Promise<DrMobileAuthResponse> {
    const payload = await this.getDefaultAuthPayload(integration);
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.post<DrMobileAuthResponse>(`/${codeIntegration}/auth`, payload),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, 'defaultAuth');
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  private async getAxiosConfig(integration: IntegrationDocument): Promise<Pick<AxiosRequestConfig, 'headers'>> {
    const response = await this.defaultAuth(integration);

    if (!response?.token) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        `Cannot authenticate: ${integration._id}`,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }

    return {
      headers: {
        Authorization: `Bearer ${response.token}`,
      },
    };
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: DrMobileCreatePatient,
  ): Promise<DrMobileCreatePatienResponse> {
    const methodName = 'createPatient';
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    this.debugRequest(integration, payload);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.post<DrMobileCreatePatienResponse>(`/${codeIntegration}/cadastra/paciente`, payload, config),
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

  public async getPatient(
    integration: IntegrationDocument,
    payload: DrMobileGetPatientRequest,
  ): Promise<DrMobilePatient> {
    this.debugRequest(integration, payload);
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobilePatient>(`/${codeIntegration}/paciente/cpf/${payload.cpf}`, {
          ...config,
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

  public async cancelSchedule(
    integration: IntegrationDocument,
    data: DrMobileCancelScheduleParams,
  ): Promise<DrMobileCancelScheduleResponse> {
    const methodName = 'cancelSchedule';
    const { patientCode, scheduleCode } = data;
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      data = cleanseObject(data);
    } catch (error) {}

    this.debugRequest(integration, data);
    this.dispatchAuditEvent(integration, data, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.delete<DrMobileCancelScheduleResponse>(
          `/${codeIntegration}/cancela/${patientCode}/${scheduleCode}`,
          config,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, data, 'cancelSchedule');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async confirmSchedule(integration: IntegrationDocument, params: DrMobileConfirmScheduleParams): Promise<void> {
    const methodName = 'confirmSchedule';
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.patch<void>(`/${codeIntegration}/agendamento/paciente/presencafalta`, params, config),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response.data;
    } catch (error) {
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listOrganizationUnits(
    integration: IntegrationDocument,
    params: DrMobileOrganizationUnitsParamsRequest,
  ): Promise<DrMobileOrganizationUnit[]> {
    this.debugRequest(integration, params);
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      params = cleanseObject(params);
    } catch (error) {}

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileOrganizationUnitsResponse>(
          `/${codeIntegration}/lista/unidade/${params.specialityCode}`,
          config,
        ),
      );

      return response?.data?.unidades ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listOrganizationUnits');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listDoctors(
    integration: IntegrationDocument,
    params: DrMobileDoctorsParamsRequest,
  ): Promise<DrMobileDoctor[]> {
    this.debugRequest(integration, params);
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      params = cleanseObject(params);
    } catch (error) {}

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileDoctor[]>(`/${codeIntegration}/prestadores/${params.specialityCode}`, config),
      );

      return response?.data ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listDoctors');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listDoctorsByUnit(
    integration: IntegrationDocument,
    params: DrMobileDoctorsByUnitParamsRequest,
  ): Promise<DrMobileDoctor[]> {
    this.debugRequest(integration, params);
    const { organizationUnitCode, insuranceCode, specialityCode } = params;
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      params = cleanseObject(params);
    } catch (error) {}

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileDoctor[]>(
          `/${codeIntegration}/prestadores/${organizationUnitCode}/${specialityCode}/${insuranceCode}`,
          config,
        ),
      );

      return response?.data?.length ? response.data : [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listDoctorsByUnit');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listAvailableSchedules(
    integration: IntegrationDocument,
    payload: DrMobileAvailableSchedules,
  ): Promise<DrMobileAvailableSchedule[]> {
    const methodName = 'listAvailableSchedules';
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.post<DrMobileAvailableSchedulesResponse>(
          `/${codeIntegration}/localizahorarios`,
          payload,
          config,
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data?.menuhorarios ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, payload, 'listAvailableSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createSchedule(
    integration: IntegrationDocument,
    payload: DrMobileCreateSchedule,
  ): Promise<DrMobileCreateScheduleResponse> {
    const methodName = 'createSchedule';
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.post<DrMobileCreateScheduleResponse>(`/${codeIntegration}/agendamento`, payload, config),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
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

  public async listInsurances(integration: IntegrationDocument): Promise<DrMobileInsurancesResponse[]> {
    this.debugRequest(integration, {});
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileInsurancesResponse[]>(`/${codeIntegration}/convenios/agendamento`, config),
      );

      return response?.data ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listInsurances');
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
  ): Promise<DrMobileSpeciality[]> {
    this.debugRequest(integration, {});
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileSpecialitiesResponse>(`/${codeIntegration}/especialidades`, config),
      );

      return response?.data?.data ?? [];
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
    params: DrMobileProceduresParamsRequest,
  ): Promise<DrMobileProceduresResponse[]> {
    this.debugRequest(integration, {});
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileProceduresResponse[]>(
          `/${codeIntegration}/agendamento/itens/servico/${params.specialityCode}`,
          config,
        ),
      );

      return response?.data ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, undefined, 'listProcedures');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsurancePlans(
    integration: IntegrationDocument,
    params: DrMobileInsurancePlansParamsRequest,
  ): Promise<DrMobileInsurancePlansResponse[]> {
    this.debugRequest(integration, params);
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      params = cleanseObject(params);
    } catch (error) {}

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileInsurancePlansResponse[]>(
          `/${codeIntegration}/paciente/convenios/${params.insuranceCode}/planos`,
          config,
        ),
      );

      return response?.data ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, 'listInsurancePlans');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listInsuranceSubPlans(
    integration: IntegrationDocument,
    params: DrMobileInsuranceSubPlansParamsRequest,
  ): Promise<DrMobileInsuranceSubPlansResponse[]> {
    this.debugRequest(integration, params);
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      params = cleanseObject(params);
    } catch (error) {}

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileInsuranceSubPlansResponse[]>(
          `/${codeIntegration}/paciente/convenios/${params.insuranceCode}/${params.insuranePlanCode}/planos`,
          config,
        ),
      );

      return response?.data ?? [];
    } catch (error) {
      await this.handleResponseError(integration, error, { params }, 'listInsuranceSubPlans');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async listPatientSchedules(
    integration: IntegrationDocument,
    params: DrMobilePatientSchedules,
  ): Promise<DrMobilePatientSchedulesResponse> {
    this.debugRequest(integration, params);
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      params = cleanseObject(params);
    } catch (error) {}

    try {
      const config = await this.getAxiosConfig(integration);

      const response = await lastValueFrom(
        this.httpService.get<DrMobilePatientSchedulesAxiosResponse>(`/${codeIntegration}/agendamentos`, {
          ...config,
          params,
        }),
      );

      return response?.data.data;
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
    params: DrMobileListSchedulesParams,
  ): Promise<DrMobileScheduleConfirmation[]> {
    this.debugRequest(integration, params);
    const { codeIntegration } = await this.credentialsHelper.getConfig<DrMobileCredentialsResponse>(integration);

    try {
      params = cleanseObject(params);
    } catch (error) {}

    try {
      const config = await this.getAxiosConfig(integration);
      const response = await lastValueFrom(
        this.httpService.get<DrMobileScheduleConfirmation[]>(`/${codeIntegration}/agendamentos/listarhorarios`, {
          ...config,
          params,
        }),
      );

      return response?.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'listSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
