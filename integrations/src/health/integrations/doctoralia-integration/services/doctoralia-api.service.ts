import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import {
  ActivitiesResponse,
  AreasResponse,
  DoctoraliaResponseArray,
  DoctoraliaResponsePlain,
  InsuranceResponse,
  ResourcesResponse,
  TypologiesResponse,
} from '../interfaces';
import {
  DoctoraliaUpdateAppointmentRequest,
  AppointmentResponse,
  DoctoraliaConfirmedAppointmentResponse,
  DoctoraliaAvailableSchedules,
  DoctoraliaCreateAppointmentRequest,
} from '../interfaces/appointment.interface';
import {
  DoctoraliaUpdatePatientRequest,
  DoctoraliaCreatePatientRequest,
  DoctoraliaCreatePatientResponse,
  DoctoraliaGetPatientResponse,
} from '../interfaces/patient.interface';
import * as Sentry from '@sentry/node';
import { lastValueFrom } from 'rxjs';
import * as contextService from 'request-context';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { formatException } from '../../../../common/helpers/format-exception-audit';
import { cleanseObject } from '../../../../common/helpers/cleanse-object';
import { requestsExternalCounter } from '../../../../common/prom-metrics';
import { IntegrationType } from '../../../interfaces/integration-types';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { DoctoraliaCredentialsResponse } from '../interfaces/credentials';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';

type ParamsType = { [key: string]: string };

const defaultParamsEntities = {
  force_entities_web_visibility: 1,
};

@Injectable()
export class DoctoraliaApiService {
  private readonly logger = new Logger(DoctoraliaApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.DOCTORALIA).inc();
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

    if (error?.response?.data && !ignoreException && integration.environment !== IntegrationEnvironment.test) {
      const metadata = contextService.get('req:default-headers');
      Sentry.captureEvent({
        message: `${integration._id}:${integration.name}:TUOTEMPO-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error.response, metadata),
      });
    }
  }

  private async getCodeIntegration(integration: IntegrationDocument) {
    const { codeIntegration } = await this.credentialsHelper.getConfig<DoctoraliaCredentialsResponse>(integration);
    return codeIntegration;
  }

  private async getHeaders(integration: IntegrationDocument) {
    const { apiToken } = await this.credentialsHelper.getConfig<DoctoraliaCredentialsResponse>(integration);

    return {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    };
  }

  private debugRequest(integration: IntegrationDocument, payload: any, funcName: string) {
    if (!(integration as any).debug) {
      return;
    }
    this.logger.debug(`${integration._id}:${integration.name}:DOCTORALIA-debug:${funcName}`, payload);
  }

  public async getProcedures(
    integration: IntegrationDocument,
    params?: ParamsType,
  ): Promise<DoctoraliaResponseArray<ActivitiesResponse[]>> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.getProcedures.name);
    this.dispatchAuditEvent(integration, params, this.getProcedures.name, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<ActivitiesResponse[]>>(`/${codeIntegration}/activities`, {
          ...(await this.getHeaders(integration)),
          params: {
            ...(params ?? {}),
            ...defaultParamsEntities,
            fields:
              'user_min_age,user_max_age,activityTitle,typologyid,activityid,price,duration,preparation,mopBookability',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getProcedures.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'getProcedures');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getResources(
    integration: IntegrationDocument,
    params?: ParamsType,
  ): Promise<DoctoraliaResponseArray<ResourcesResponse[]>> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.getResources.name);
    this.dispatchAuditEvent(integration, params, this.getResources.name, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<ResourcesResponse[]>>(`/${codeIntegration}/resources`, {
          ...(await this.getHeaders(integration)),
          params: {
            ...(params ?? {}),
            ...defaultParamsEntities,
            fields: 'resourceName,resourceid',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getResources.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'getResources');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getResourcesDistinct(
    integration: IntegrationDocument,
    params?: ParamsType,
  ): Promise<DoctoraliaResponseArray<ResourcesResponse[]>> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<ResourcesResponse[]>>(`/${codeIntegration}/resources/_distinct`, {
          ...(await this.getHeaders(integration)),
          params: {
            ...(params ?? {}),
            ...defaultParamsEntities,
            group_by: 'resource_consumerid',
            fields: 'resourceName,resourceid',
          },
        }),
      );

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'getResources');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getSpecialities(
    integration: IntegrationDocument,
    params?: ParamsType,
  ): Promise<DoctoraliaResponseArray<TypologiesResponse[]>> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.getSpecialities.name);
    this.dispatchAuditEvent(integration, params, this.getSpecialities.name, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<TypologiesResponse[]>>(`/${codeIntegration}/typologies`, {
          ...(await this.getHeaders(integration)),
          params: {
            ...(params ?? {}),
            ...defaultParamsEntities,
            fields: 'typologyTitle,typologyid,legacyid',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getSpecialities.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'getSpecialities');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getInsurances(
    integration: IntegrationDocument,
    params?: ParamsType,
  ): Promise<DoctoraliaResponseArray<InsuranceResponse[]>> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.getInsurances.name);
    this.dispatchAuditEvent(integration, params, this.getInsurances.name, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<InsuranceResponse[]>>(`/${codeIntegration}/insurances`, {
          ...(await this.getHeaders(integration)),
          params: {
            ...(params ?? {}),
            ...defaultParamsEntities,
            fields: 'insurance_title,insuranceid,ex_legacyid,legacyTitle,isHiddenResource,tags,legacyid',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getInsurances.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'getInsurances');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getAreas(
    integration: IntegrationDocument,
    params?: ParamsType,
    ignoreException?: boolean,
  ): Promise<DoctoraliaResponseArray<AreasResponse[]>> {
    try {
      params = cleanseObject(params);
    } catch (error) {}

    this.debugRequest(integration, params, this.getAreas.name);
    this.dispatchAuditEvent(integration, params, this.getAreas.name, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<AreasResponse[]>>(`/${codeIntegration}/areas`, {
          ...(await this.getHeaders(integration)),
          params: {
            ...(params ?? {}),
            ...defaultParamsEntities,
            fields: 'areaid,areaTitle,address',
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getAreas.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, params, 'getAreas', ignoreException);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientByCode(
    integration: IntegrationDocument,
    code: string,
  ): Promise<DoctoraliaResponsePlain<DoctoraliaGetPatientResponse>> {
    this.debugRequest(integration, { code }, this.getPatientByCode.name);
    this.dispatchAuditEvent(integration, { code }, this.getPatientByCode.name, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponsePlain<DoctoraliaGetPatientResponse>>(
          `/${codeIntegration}/users/${code}`,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, this.getPatientByCode.name, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { code }, 'getPatientByCode');
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientByCpf(
    integration: IntegrationDocument,
    cpf: string,
  ): Promise<DoctoraliaResponseArray<DoctoraliaGetPatientResponse[]>> {
    const methodName = 'getPatientByCpf';

    this.debugRequest(integration, { cpf }, methodName);
    this.dispatchAuditEvent(integration, { cpf }, methodName, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<DoctoraliaGetPatientResponse[]>>(`/${codeIntegration}/users`, {
          ...(await this.getHeaders(integration)),
          params: {
            idnumber: cpf,
          },
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      if (response.data.return?.results?.length === 0) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { cpf }, methodName);
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        throw HTTP_ERROR_THROWER(HttpStatus.NOT_FOUND, 'User not found', undefined, true);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createPatient(
    integration: IntegrationDocument,
    payload: DoctoraliaCreatePatientRequest,
  ): Promise<DoctoraliaResponsePlain<DoctoraliaCreatePatientResponse>> {
    const methodName = 'createPatient';

    this.debugRequest(integration, payload, methodName);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.post<DoctoraliaResponsePlain<DoctoraliaCreatePatientResponse>>(
          `/${codeIntegration}/users`,
          { ...payload, bypass_duplicates: true },
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
      if (error?.response?.status === HttpStatus.CONFLICT) {
        throw HTTP_ERROR_THROWER(
          HttpStatus.CONFLICT,
          {
            message: 'User already exists',
            memberId: error.response.data.return.user_id,
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
    payload: DoctoraliaUpdatePatientRequest,
    patientCode: string,
  ): Promise<DoctoraliaResponsePlain<string>> {
    const methodName = 'updatePatient';

    this.debugRequest(integration, payload, methodName);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.put<DoctoraliaResponsePlain<string>>(
          `/${codeIntegration}/users/${patientCode}`,
          { ...payload, bypass_duplicates: true },
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
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

  public async getAppointments(
    integration: IntegrationDocument,
    payload: DoctoraliaAvailableSchedules,
  ): Promise<DoctoraliaResponseArray<AppointmentResponse>> {
    const methodName = 'getAppointments';

    this.debugRequest(integration, payload, methodName);

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<AppointmentResponse>>(`/${codeIntegration}/availabilities`, {
          ...(await this.getHeaders(integration)),
          params: {
            ...payload,
            maxResults: 500,
            fields:
              'machid,start_datetime_timestamp,duration,activityid,resourceid,areaid,activityPrice,provider_session_id,startTime,notice,endTime',
          },
          timeout: 120_000,
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async createAppointment(
    integration: IntegrationDocument,
    payload: DoctoraliaCreateAppointmentRequest,
  ): Promise<DoctoraliaResponsePlain<string>> {
    const methodName = 'createAppointment';

    this.debugRequest(integration, payload, methodName);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.post<DoctoraliaResponsePlain<string>>(`/${codeIntegration}/reservations`, payload, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);

      if (
        error?.response?.data?.exception === 'PROVIDER_RESERVATION_CONFLICT_ERROR' ||
        error?.response?.data?.msg?.includes('horário não está mais disponível') ||
        (error?.response?.data?.exception === 'TUOTEMPO_VALIDATION_ERROR' &&
          error?.response?.data?.msg?.includes('Horu00e1rio nu00e3o disponu00edvel')) ||
        (error?.response?.data?.exception === 'INTEGRATION_INVALID_API_RESPONSE' &&
          error?.response?.data?.msg?.includes('Agendamento não disponível'))
      ) {
        throw HTTP_ERROR_THROWER(HttpStatus.CONFLICT, 'Filled schedule', HttpErrorOrigin.INTEGRATION_ERROR);
      }

      if (
        error?.response?.data?.exception === 'TUOTEMPO_UNKNOWN_ERROR' &&
        error?.response?.data?.providers_requests?.[codeIntegration]?.[0]?.response === 'OK'
      ) {
        throw HTTP_ERROR_THROWER(HttpStatus.OK, null, HttpErrorOrigin.INTEGRATION_ERROR);
      }

      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async getPatientSchedules(
    integration: IntegrationDocument,
    patientCode: string,
  ): Promise<DoctoraliaResponseArray<DoctoraliaConfirmedAppointmentResponse[]>> {
    this.debugRequest(integration, { patientCode }, this.getPatientSchedules.name);
    this.dispatchAuditEvent(integration, { patientCode }, this.getPatientSchedules.name, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.get<DoctoraliaResponseArray<DoctoraliaConfirmedAppointmentResponse[]>>(
          `/${codeIntegration}/reservations`,
          {
            ...(await this.getHeaders(integration)),
            params: {
              userid: patientCode,
              fields:
                'resid,start_datetime_timestamp,startTime,reservation_duration,activityid,resourceid,areaid,typologyid,insuranceid,activityTitle,areaTitle,typology_lid,typologyTitle,insuranceTitle,resourceName,cancelled,status_code',
            },
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
      await this.handleResponseError(integration, error, { patientCode }, 'getPatientSchedules');
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async cancelAppointment(
    integration: IntegrationDocument,
    appointmentId: string,
  ): Promise<DoctoraliaResponsePlain<string>> {
    const methodName = 'cancelAppointment';

    this.debugRequest(integration, { appointmentId }, methodName);
    this.dispatchAuditEvent(integration, { appointmentId }, methodName, AuditDataType.externalRequest);

    const codeIntegration = await this.getCodeIntegration(integration);

    try {
      const response = await lastValueFrom(
        this.httpService.delete<DoctoraliaResponsePlain<string>>(`/${codeIntegration}/reservations/${appointmentId}`, {
          ...(await this.getHeaders(integration)),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, { appointmentId }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  public async updateAppointment(
    integration: IntegrationDocument,
    appointmentId: string,
    payload: DoctoraliaUpdateAppointmentRequest,
  ): Promise<DoctoraliaResponsePlain<string>> {
    const methodName = 'updateAppointment';

    this.debugRequest(integration, payload, methodName);

    try {
      payload = cleanseObject(payload);
    } catch (error) {}

    try {
      this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

      const codeIntegration = await this.getCodeIntegration(integration);

      const response = await lastValueFrom(
        this.httpService.put<DoctoraliaResponsePlain<string>>(
          `/${codeIntegration}/reservations/${appointmentId}`,
          {
            ...payload,
          },
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);

      return response.data;
    } catch (error) {
      await this.handleResponseError(integration, error, payload, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
