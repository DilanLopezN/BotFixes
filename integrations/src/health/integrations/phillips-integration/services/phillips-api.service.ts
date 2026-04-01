import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpErrorOrigin, HTTP_ERROR_THROWER } from '../../../../common/exceptions.service';
import * as Sentry from '@sentry/node';
import { lastValueFrom } from 'rxjs';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';
import { IntegrationEnvironment } from '../../../integration/interfaces/integration.interface';
import * as contextService from 'request-context';
import { SentryErrorHandlerService } from '../../../shared/metadata-sentry.service';
import { AuditDataType } from '../../../audit/audit.interface';
import { requestsExternalCounter } from '../../../../common/prom-metrics';

import { formatException } from '../../../../common/helpers/format-exception-audit';
import { AuditService } from '../../../audit/services/audit.service';
import { CredentialsHelper } from '../../../credentials/credentials.service';
import { castObjectIdToString } from '../../../../common/helpers/cast-objectid';
import { PhillipsCredentialsResponse } from '../interfaces/credentials';
import {
  PhillipsListSchedulesResponse,
  PhillipsNaturalPerson,
  PhillipsEstablishment,
  PhillipsMedicalSpecialty,
  PhillipsInsurance,
  PhillipsActivePhysician,
  PhillipsUpdateConsultationStatusPayload,
  PhillipsUpdateConsultationStatusResponse,
  PhillipsListExamsScheduleResponse,
  PhillipsListProceduresResponse,
  PhillipsProcedure,
  PhillipsUpdateExamStatusPayload,
  PhillipsUpdateExamStatusResponse,
  PhillipsAvailableConsultationResponse,
  PhillipsBookConsultationPayload,
  PhillipsBookConsultationResponse,
  PhillipsAvailableExamsResponse,
  PhillipsCreatePatientPayload,
  PhillipsCreatePatientResponse,
  PhillipsParamsType,
} from '../interfaces';
import { IntegrationType } from '../../../../health/interfaces/integration-types';

@Injectable()
export class PhillipsApiService {
  private logger = new Logger(PhillipsApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly sentryErrorHandlerService: SentryErrorHandlerService,
    private readonly auditService: AuditService,
    private readonly credentialsHelper: CredentialsHelper,
  ) {
    this.httpService.axiosRef.interceptors.request.use(
      async function (config) {
        try {
          requestsExternalCounter.labels(IntegrationType.PHILLIPS).inc();
        } catch (error) {}
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  // ========== UTILITY / PRIVATE METHODS ==========
  private debugRequest(integration: IntegrationDocument, payload: any, funcName?: string) {
    if (!integration || (!integration.debug && process.env.NODE_ENV !== 'local')) return;

    const base = `${integration._id}:${integration.name}:${IntegrationType.PHILLIPS}-debug`;
    const label = funcName ? `${base}:${funcName}` : base;

    this.logger.debug(label, payload);
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

  private handleResponseError(
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
        message: `${castObjectIdToString(integration._id)}:${integration.name}:PHILLIPS-request: ${from}`,
        ...this.sentryErrorHandlerService.defaultApiIntegrationError(payload, error?.response, metadata),
      });
    }
  }

  private async getHeaders(integration: IntegrationDocument): Promise<{ headers: Record<string, string> }> {
    const { apiToken } = await this.credentialsHelper.getConfig<PhillipsCredentialsResponse>(integration);

    if (!apiToken) {
      throw HTTP_ERROR_THROWER(HttpStatus.UNAUTHORIZED, 'Invalid Phillips API token');
    }

    return {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    };
  }

  private async getApiUrl(integration: IntegrationDocument, endpoint: string): Promise<string> {
    const { apiUrl } = await this.credentialsHelper.getConfig<PhillipsCredentialsResponse>(integration);
    return `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  // ========== A1 - LIST SCHEDULES CONSULTATION ==========
  // GET /api/schedules/consultation

  public async listSchedulesConsultation(
    integration: IntegrationDocument,
    params: PhillipsParamsType,
  ): Promise<PhillipsListSchedulesResponse> {
    const methodName = 'listSchedulesConsultation';
    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsListSchedulesResponse>(
          await this.getApiUrl(integration, '/api/schedules/consultation'),
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

  // ========== A2 - GET PATIENT (NATURAL PERSON) ==========
  // GET /api/natural-person/{code}

  public async getPatient(
    integration: IntegrationDocument,
    code: string,
    params?: PhillipsParamsType,
  ): Promise<PhillipsNaturalPerson> {
    const methodName = 'getPatient';
    this.debugRequest(integration, { code, ...params });
    this.dispatchAuditEvent(integration, { code, ...params }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsNaturalPerson>(await this.getApiUrl(integration, `/api/natural-person/${code}`), {
          ...(await this.getHeaders(integration)),
          ...(params && { params }),
        }),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { code, ...params }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== CREATE PATIENT ==========
  // POST /api/natural-person

  public async createPatient(
    integration: IntegrationDocument,
    payload: PhillipsCreatePatientPayload,
  ): Promise<PhillipsCreatePatientResponse> {
    const methodName = 'createPatient';
    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<PhillipsCreatePatientResponse>(
          await this.getApiUrl(integration, '/api/natural-person'),
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
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== A3 - LIST ESTABLISHMENTS ==========
  // GET /api/establishments/actives

  public async getEstablishments(integration: IntegrationDocument): Promise<PhillipsEstablishment[]> {
    const methodName = 'getEstablishments';
    this.debugRequest(integration, {});
    this.dispatchAuditEvent(integration, {}, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsEstablishment[]>(
          await this.getApiUrl(integration, '/api/establishments/actives'),
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, undefined, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== A4 - LIST MEDICAL SPECIALTIES ==========
  // GET /api/medicalSpecialties/actives
  // GET /api/medicalSpecialties/{code}

  public async getSpecialities(
    integration: IntegrationDocument,
    params?: PhillipsParamsType,
  ): Promise<PhillipsMedicalSpecialty[]> {
    const methodName = 'getSpecialities';
    this.debugRequest(integration, params ?? {});
    this.dispatchAuditEvent(integration, params ?? {}, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsMedicalSpecialty[]>(
          await this.getApiUrl(integration, '/api/medicalSpecialties/actives'),
          {
            ...(await this.getHeaders(integration)),
            ...(params && { params }),
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

  public async getSpecialityByCode(integration: IntegrationDocument, code: number): Promise<PhillipsMedicalSpecialty> {
    const methodName = 'getSpecialityByCode';
    this.debugRequest(integration, { code });
    this.dispatchAuditEvent(integration, { code }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsMedicalSpecialty>(
          await this.getApiUrl(integration, `/api/medicalSpecialties/${code}`),
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { code }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== A5 - LIST INSURANCES ==========
  // GET /api/insurances/insuranceCode?insuranceCode=X

  public async getInsurances(
    integration: IntegrationDocument,
    params: PhillipsParamsType,
  ): Promise<PhillipsInsurance | PhillipsInsurance[]> {
    const methodName = 'getInsurances';
    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsInsurance | PhillipsInsurance[]>(
          await this.getApiUrl(integration, '/api/insurances/insuranceCode'),
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

  // ========== A6 - LIST ACTIVE PHYSICIANS ==========
  // GET /api/schedules/integrated-schedule/active-physicians/

  public async getDoctors(
    integration: IntegrationDocument,
    params: PhillipsParamsType,
  ): Promise<PhillipsActivePhysician[]> {
    const methodName = 'getDoctors';
    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsActivePhysician[]>(
          await this.getApiUrl(integration, '/api/schedules/integrated-schedule/active-physicians/'),
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

  // ========== A7 - UPDATE CONSULTATION STATUS (CONFIRM / CANCEL) ==========
  // PUT /api/schedules/consultation/{sequence}/status

  public async updateConsultationStatus(
    integration: IntegrationDocument,
    sequence: number,
    payload: PhillipsUpdateConsultationStatusPayload,
  ): Promise<PhillipsUpdateConsultationStatusResponse> {
    const methodName = 'updateConsultationStatus';
    const auditPayload = { sequence, ...payload };
    this.debugRequest(integration, auditPayload);
    this.dispatchAuditEvent(integration, auditPayload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.put<PhillipsUpdateConsultationStatusResponse>(
          await this.getApiUrl(integration, `/api/schedules/consultation/${sequence}/status`),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, auditPayload, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== A8 - LIST EXAMS SCHEDULE ==========
  // GET /api/schedules/exams/consultation

  public async listExamsSchedule(
    integration: IntegrationDocument,
    params: PhillipsParamsType,
  ): Promise<PhillipsListExamsScheduleResponse> {
    const methodName = 'listExamsSchedule';
    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsListExamsScheduleResponse>(
          await this.getApiUrl(integration, '/api/schedules/exams/consultation'),
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

  // ========== A9 - LIST INTERNAL PROCEDURES ==========
  // GET /api/internalProcedures/actives

  public async getProcedures(
    integration: IntegrationDocument,
    params: PhillipsParamsType,
  ): Promise<PhillipsListProceduresResponse> {
    const methodName = 'getProcedures';
    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsListProceduresResponse>(
          await this.getApiUrl(integration, '/api/internalProcedures/actives'),
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

  // ========== A9 - GET SINGLE PROCEDURE BY CODE ==========
  // GET /api/internalProcedures/internalProcedureCode/?internalProcedureCode=X

  public async getProcedureByCode(
    integration: IntegrationDocument,
    internalProcedureCode: number,
  ): Promise<PhillipsProcedure> {
    const methodName = 'getProcedureByCode';
    this.debugRequest(integration, { internalProcedureCode });
    this.dispatchAuditEvent(integration, { internalProcedureCode }, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsProcedure>(
          await this.getApiUrl(integration, '/api/internalProcedures/internalProcedureCode/'),
          {
            ...(await this.getHeaders(integration)),
            params: { internalProcedureCode },
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, { internalProcedureCode }, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== A10 - UPDATE EXAM STATUS (CONFIRM / CANCEL) ==========
  // PUT /api/schedules/exams/{sequence}/status

  public async updateExamStatus(
    integration: IntegrationDocument,
    sequence: number,
    payload: PhillipsUpdateExamStatusPayload,
  ): Promise<PhillipsUpdateExamStatusResponse> {
    const methodName = 'updateExamStatus';
    const auditPayload = { sequence, ...payload };
    this.debugRequest(integration, auditPayload);
    this.dispatchAuditEvent(integration, auditPayload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.put<PhillipsUpdateExamStatusResponse>(
          await this.getApiUrl(integration, `/api/schedules/exams/${sequence}/status`),
          payload,
          {
            ...(await this.getHeaders(integration)),
          },
        ),
      );

      this.dispatchAuditEvent(integration, response?.data, methodName, AuditDataType.externalResponse);
      return response?.data;
    } catch (error) {
      this.handleResponseError(integration, error, auditPayload, methodName);
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== B.01 - GET AVAILABLE SCHEDULES CONSULTATION ==========
  // GET /api/schedules/consultation/available

  public async getAvailableSchedulesConsultation(
    integration: IntegrationDocument,
    params: PhillipsParamsType,
  ): Promise<PhillipsAvailableConsultationResponse> {
    const methodName = 'getAvailableSchedulesConsultation';
    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsAvailableConsultationResponse>(
          await this.getApiUrl(integration, '/api/schedules/consultation/available'),
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

  // ========== B.02 - CREATE SCHEDULE CONSULTATION (BOOK TIME) ==========
  // POST /api/schedules/consultation/book-time

  public async bookConsultation(
    integration: IntegrationDocument,
    payload: PhillipsBookConsultationPayload,
  ): Promise<PhillipsBookConsultationResponse> {
    const methodName = 'bookConsultation';
    this.debugRequest(integration, payload);
    this.dispatchAuditEvent(integration, payload, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.post<PhillipsBookConsultationResponse>(
          await this.getApiUrl(integration, '/api/schedules/consultation/book-time'),
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
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  // ========== B.03 - GET AVAILABLE SCHEDULES EXAMS ==========
  // GET /api/schedules/exams/available

  public async getAvailableSchedulesExams(
    integration: IntegrationDocument,
    params: PhillipsParamsType,
  ): Promise<PhillipsAvailableExamsResponse> {
    const methodName = 'getAvailableSchedulesExams';
    this.debugRequest(integration, params);
    this.dispatchAuditEvent(integration, params, methodName, AuditDataType.externalRequest);

    try {
      const response = await lastValueFrom(
        this.httpService.get<PhillipsAvailableExamsResponse>(
          await this.getApiUrl(integration, '/api/schedules/exams/available'),
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

  // ========== MÉTODOS NÃO LIBERADOS (NOT IMPLEMENTED) ==========

  public async updatePatient(integration: IntegrationDocument, code: string, payload: any): Promise<any> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'Phillips updatePatient not implemented yet');
  }

  public async getOrganizationUnits(integration: IntegrationDocument): Promise<PhillipsEstablishment[]> {
    return this.getEstablishments(integration);
  }

  public async getInsurancePlans(integration: IntegrationDocument, params?: any): Promise<any> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'Phillips getInsurancePlans not implemented yet');
  }

  public async getAppointmentValue(integration: IntegrationDocument, params?: any): Promise<any> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'Phillips getAppointmentValue not implemented yet');
  }

  public async getPatientSchedules(integration: IntegrationDocument, patientCode: string): Promise<any> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'Phillips getPatientSchedules not implemented yet');
  }

  public async cancelSchedule(integration: IntegrationDocument, scheduleCode: number): Promise<any> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'Phillips cancelSchedule not implemented yet');
  }

  public async confirmSchedule(integration: IntegrationDocument, scheduleCode: number): Promise<any> {
    throw HTTP_ERROR_THROWER(HttpStatus.NOT_IMPLEMENTED, 'Phillips confirmSchedule not implemented yet');
  }

  public async listSchedules(integration: IntegrationDocument, params?: any): Promise<any> {
    throw HTTP_ERROR_THROWER(
      HttpStatus.NOT_IMPLEMENTED,
      'Phillips listSchedules not implemented yet - use listSchedulesConsultation',
    );
  }
}
