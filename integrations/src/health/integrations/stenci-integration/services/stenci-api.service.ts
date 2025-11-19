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
import { AxiosRequestConfig } from 'axios';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import {
  StenciCredentialsResponse,
  StenciAppointmentResponse,
  StenciCreateAppointmentRequest,
  StenciUpdateAppointmentRequest,
  StenciListAppointmentsParams,
  StenciFreeHoursParams,
  StenciFreeHoursResponse,
  StenciProfessionalsResponse,
  StenciListProfessionalsParams,
  StenciProfessionalResponse,
  StenciPatientsResponse,
  StenciListPatientsParams,
  StenciPatientResponse,
  StenciCreatePatientRequest,
  StenciUpdatePatientRequest,
  StenciInsurancePlansResponse,
  StenciListInsurancePlansParams,
  StenciInsurancePlanResponse,
  StenciListProceduresResponse,
  StenciListProceduresParams,
  StenciServiceResponse,
  StenciSpecialtiesResponse,
  StenciListSpecialtiesParams,
  StenciListSchedulesParams,
} from '../interfaces';

@Injectable()
export class StenciApiService {
  private logger = new Logger(StenciApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.STENCI).inc();
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

    this.logger.debug(`${integration._id}:${integration.name}:${IntegrationType.STENCI}-debug:${funcName}`, payload);
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
        message: `${integration._id}:${integration.name}:${IntegrationType.STENCI}-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
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

  private async getDefaultConfig(
    integration: IntegrationDocument,
    organizationUnitCode?: string,
  ): Promise<AxiosRequestConfig[]> {
    const { api_key, base_url } = await this.credentialsHelper.getConfig<StenciCredentialsResponse>(integration);
    const apiKeys: Record<number, string> = typeof api_key === 'string' ? JSON.parse(api_key) : api_key;

    if (organizationUnitCode) {
      return [
        {
          baseURL: base_url,
          headers: {
            'x-api-key': apiKeys[organizationUnitCode],
            'Content-Type': 'application/json',
          },
        },
      ];
    }

    return Object.values(apiKeys).map((organizationUnitCode) => ({
      baseURL: base_url,
      headers: {
        'x-api-key': organizationUnitCode,
        'Content-Type': 'application/json',
      },
    }));
  }

  private async executeWithMultipleConfigs<T>(
    integration: IntegrationDocument,
    requestFn: (config: AxiosRequestConfig) => Promise<any>,
    funcName: string,
    payload?: any,
    specificorganizationUnitCode?: string,
  ): Promise<T> {
    const configs = await this.getDefaultConfig(integration, specificorganizationUnitCode);
    const promises = configs.map((config) => requestFn(config));

    const responses = (await Promise.allSettled(promises)).map((response, index) => ({
      ...response,
      organizationUnitCode: index + 1,
    }));
    const successfulResponses = responses.filter(
      (response) => response.status === 'fulfilled',
    ) as PromiseFulfilledResult<T>[];
    const failedResponses = responses.filter((response) => response.status === 'rejected') as PromiseRejectedResult[];

    if (failedResponses.length > 0) {
      this.handleResponseError(integration, failedResponses, payload, funcName);
    }
    if (successfulResponses.length === 0) {
      throw new Error('All API calls failed');
    }

    const funcNamesFilter = [this.listSchedulesToConfirm.name, this.listPatients.name, this.listAppointments.name];
    if (funcNamesFilter.find((funcNameFilter) => funcNameFilter == funcName)) {
      const result = successfulResponses.map((response) => ({
        data: (response.value as any).data,
        organizationUnitCode: (response as any).organizationUnitCode,
      }));
      this.dispatchAuditEvent(integration, result, funcName, AuditDataType.externalResponse);
      return result as T;
    }
    const result = successfulResponses.map((response) => (response.value as any).data);
    this.dispatchAuditEvent(integration, result, funcName, AuditDataType.externalResponse);
    return result as T;
  }

  // ==================== APPOINTMENTS ====================

  public async listAppointments(
    integration: IntegrationDocument,
    params: StenciListAppointmentsParams,
    organizationUnitCode?: string,
  ): Promise<StenciAppointmentResponse[]> {
    const funcName = this.listAppointments.name;
    this.debugRequest(integration, params, funcName);

    try {
      const result = await this.executeWithMultipleConfigs<StenciAppointmentResponse[]>(
        integration,
        (config) =>
          lastValueFrom(
            this.httpService.get('/api/external/integration/appointments', {
              ...config,
              params,
            }),
          ),
        funcName,
        params,
        organizationUnitCode,
      );

      // Handle different response formats
      if (Array.isArray(result)) {
        return result;
      } else if (result && typeof result === 'object' && 'items' in result && Array.isArray((result as any).items)) {
        return (result as any).items;
      } else {
        return [];
      }
    } catch (error) {
      await this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error listing appointments', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getAppointmentById(
    integration: IntegrationDocument,
    id: string,
    organizationUnitCode?: string,
  ): Promise<StenciAppointmentResponse[]> {
    const funcName = this.getAppointmentById.name;
    const payload = { id };
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      this.debugRequest(integration, {}, funcName);
      this.dispatchAuditEvent(integration, {}, funcName, AuditDataType.externalRequest);
      return this.executeWithMultipleConfigs<StenciAppointmentResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.get(`/api/external/integration/appointments/${id}`, config)),
        funcName,
        { id },
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, { id }, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error getting appointment', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async createAppointment(
    integration: IntegrationDocument,
    data: StenciCreateAppointmentRequest,
    organizationUnitCode?: string,
  ): Promise<StenciAppointmentResponse[]> {
    const funcName = this.createAppointment.name;
    this.debugRequest(integration, data, funcName);
    this.dispatchAuditEvent(integration, data, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciAppointmentResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.post('/api/external/integration/appointments', data, config)),
        funcName,
        data,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, data, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error creating appointment', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async updateAppointment(
    integration: IntegrationDocument,
    id: string,
    data: StenciUpdateAppointmentRequest,
    organizationUnitCode?: string,
  ): Promise<StenciAppointmentResponse[]> {
    const funcName = this.updateAppointment.name;
    const payload = { id, ...data };
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciAppointmentResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.put(`/api/external/integration/appointments/${id}`, data, config)),
        funcName,
        { id, ...data },
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, { id, ...data }, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error updating appointment', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async deleteAppointment(
    integration: IntegrationDocument,
    id: string,
    organizationUnitCode?: string,
  ): Promise<{ status: string }[]> {
    const funcName = this.deleteAppointment.name;
    const payload = { id };
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<{ status: string }[]>(
        integration,
        (config) => lastValueFrom(this.httpService.delete(`/api/external/integration/appointments/${id}`, config)),
        funcName,
        { id },
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, { id }, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error deleting appointment', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getFreeHours(
    integration: IntegrationDocument,
    params: StenciFreeHoursParams,
    organizationUnitCode?: string,
  ): Promise<StenciFreeHoursResponse[][]> {
    const funcName = this.getFreeHours.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciFreeHoursResponse[][]>(
        integration,
        (config) =>
          lastValueFrom(
            this.httpService.get('/api/external/integration/appointments/free-hours', {
              ...config,
              params,
            }),
          ),
        funcName,
        params,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error getting free hours', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async listSchedulesToConfirm(
    integration: IntegrationDocument,
    params: StenciListSchedulesParams,
    organizationUnitCode?: string,
  ): Promise<StenciAppointmentResponse[]> {
    const funcName = this.listSchedulesToConfirm.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciAppointmentResponse[]>(
        integration,
        (config) =>
          lastValueFrom(
            this.httpService.get('/api/external/integration/appointments', {
              ...config,
              params,
            }),
          ),
        funcName,
        params,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error listing schedules', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }
  // ==================== PROFESSIONALS ====================

  public async listProfessionals(
    integration: IntegrationDocument,
    params: StenciListProfessionalsParams,
    organizationUnitCode?: string,
  ): Promise<StenciProfessionalsResponse[]> {
    const funcName = this.listProfessionals.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciProfessionalsResponse[]>(
        integration,
        (config) =>
          lastValueFrom(
            this.httpService.get('/api/external/integration/professionals', {
              ...config,
              params,
            }),
          ),
        funcName,
        params,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        'Error listing professionals',
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getProfessionalById(
    integration: IntegrationDocument,
    id: string,
    organizationUnitCode?: string,
  ): Promise<StenciProfessionalResponse[]> {
    const funcName = this.getProfessionalById.name;
    const payload = { id };
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciProfessionalResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.get(`/api/external/integration/professionals/${id}`, config)),
        funcName,
        { id },
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, { id }, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error getting professional', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  // ==================== PATIENTS ====================

  public async listPatients(
    integration: IntegrationDocument,
    params: StenciListPatientsParams,
    organizationUnitCode?: string,
  ): Promise<StenciPatientsResponse[][]> {
    const funcName = this.listPatients.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciPatientsResponse[][]>(
        integration,
        (config) =>
          lastValueFrom(
            this.httpService.get('/api/external/integration/patients', {
              ...config,
              params,
            }),
          ),
        funcName,
        params,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error listing patients', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getPatientByIdOrIdentity(
    integration: IntegrationDocument,
    idOrIdentity: string,
    organizationUnitCode?: string,
  ): Promise<StenciPatientResponse[]> {
    const funcName = this.getPatientByIdOrIdentity.name;
    const payload = { idOrIdentity };
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciPatientResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.get(`/api/external/integration/patients/${idOrIdentity}`, config)),
        funcName,
        { idOrIdentity },
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, { idOrIdentity }, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error getting patient', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    data: StenciCreatePatientRequest,
    organizationUnitCode: string,
  ): Promise<StenciPatientResponse[]> {
    const funcName = this.createPatient.name;
    this.debugRequest(integration, data, funcName);
    this.dispatchAuditEvent(integration, data, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciPatientResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.post('/api/external/integration/patients', data, config)),
        funcName,
        data,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, data, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error creating patient', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async updatePatient(
    integration: IntegrationDocument,
    id: string,
    data: StenciUpdatePatientRequest,
    organizationUnitCode?: string,
  ): Promise<StenciPatientResponse[]> {
    const funcName = this.updatePatient.name;
    const payload = { id, ...data };
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciPatientResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.put(`/api/external/integration/patients/${id}`, data, config)),
        funcName,
        { id, ...data },
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, { id, ...data }, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error updating patient', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  // ==================== INSURANCE PLANS ====================

  public async listInsurancePlans(
    integration: IntegrationDocument,
    params: StenciListInsurancePlansParams,
    organizationUnitCode?: string,
  ): Promise<StenciInsurancePlansResponse[]> {
    const funcName = this.listInsurancePlans.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciInsurancePlansResponse[]>(
        integration,
        (config) =>
          lastValueFrom(
            this.httpService.get('/api/external/integration/insurance-plans', {
              ...config,
              params,
            }),
          ),
        funcName,
        params,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        'Error listing insurance plans',
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurancePlanById(
    integration: IntegrationDocument,
    id: string,
    organizationUnitCode?: string,
  ): Promise<StenciInsurancePlanResponse[]> {
    const funcName = this.getInsurancePlanById.name;
    const payload = { id };
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciInsurancePlanResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.get(`/api/external/integration/insurance-plans/${id}`, config)),
        funcName,
        { id },
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, { id }, funcName);
      throw HTTP_ERROR_THROWER(
        HttpStatus.BAD_REQUEST,
        'Error getting insurance plan',
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ==================== SERVICES ====================

  public async listProcedures(
    integration: IntegrationDocument,
    params: StenciListProceduresParams,
    organizationUnitCode?: string,
  ): Promise<StenciListProceduresResponse[]> {
    const funcName = this.listProcedures.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciListProceduresResponse[]>(
        integration,
        (config) =>
          lastValueFrom(
            this.httpService.get('/api/external/integration/services', {
              ...config,
              params,
            }),
          ),
        funcName,
        params,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error listing services', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  public async getProceduresById(
    integration: IntegrationDocument,
    id: string,
    organizationUnitCode?: string,
  ): Promise<StenciServiceResponse[]> {
    const funcName = this.getProceduresById.name;
    const payload = { id };
    this.debugRequest(integration, payload, funcName);
    this.dispatchAuditEvent(integration, payload, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciServiceResponse[]>(
        integration,
        (config) => lastValueFrom(this.httpService.get(`/api/external/integration/services/${id}`, config)),
        funcName,
        { id },
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, { id }, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error getting service', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }

  // ==================== SPECIALTIES ====================

  public async listSpecialties(
    integration: IntegrationDocument,
    params: StenciListSpecialtiesParams,
    organizationUnitCode?: string,
  ): Promise<StenciSpecialtiesResponse[]> {
    const funcName = this.listSpecialties.name;
    this.debugRequest(integration, params, funcName);
    this.dispatchAuditEvent(integration, params, funcName, AuditDataType.externalRequest);

    try {
      return this.executeWithMultipleConfigs<StenciSpecialtiesResponse[]>(
        integration,
        (config) =>
          lastValueFrom(
            this.httpService.get('/api/external/integration/specialties', {
              ...config,
              params,
            }),
          ),
        funcName,
        params,
        organizationUnitCode,
      );
    } catch (error) {
      await this.handleResponseError(integration, error, params, funcName);
      throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Error listing specialties', HttpErrorOrigin.INTEGRATION_ERROR);
    }
  }
}
