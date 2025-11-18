import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DownloadMedicalReportTokenData, DownloadTokenData } from '../interfaces/download-token.interface';
import * as jwt from 'jsonwebtoken';
import { IntegratorService } from '../../integrator/service/integrator.service';
import {
  CountAvailableMedicalReportsResponse,
  HasAvailableMedicalReportsFilterRequest,
  HasAvailableMedicalReportsFilterResponse,
  ListAvailableMedicalReports,
  ListAvailableMedicalReportsByPatientCode,
  ListAvailableMedicalReportsFilterRequest,
  ListAvailableMedicalReportsTokenData,
  ValidatePatientReportDownloadResponse,
  ValidPatientReportDownloadRequest,
} from '../../integrator/interfaces';
import { Types } from 'mongoose';
import { castObjectIdToString } from '../../../common/helpers/cast-objectid';
import { ListSchedules } from '../interfaces/list-schedules.interface';

@Injectable()
export class SchedulingDownloadReportService {
  constructor(
    @Inject(forwardRef(() => IntegratorService))
    private readonly integratorService: IntegratorService,
  ) {}

  private getBaseUrl(): string {
    return process.env.NODE_ENV === 'local' ? 'http://localhost:9093' : process.env.INTEGRATIONS_URL;
  }

  private registerMedicalReportDownloadToken(
    integrationId: string,
    patientErpCode: string,
    shortId: string,
    scheduleCode?: string,
    medicalReportCode?: string,
    medicalReportExamCode?: string,
    isExternal?: boolean,
  ): string {
    const data: DownloadMedicalReportTokenData = {
      integrationId,
      patientErpCode,
      scheduleCode,
      shortId,
      medicalReportCode,
      medicalReportExamCode,
      isExternal,
    };

    return jwt.sign(data, process.env.SCHEDULING_DOWNLOAD_REPORT_JWT_SECRET_KEY, {
      expiresIn: '24h',
    });
  }

  public createDownloadMedicalReportLink(
    integrationId: string,
    patientErpCode: string,
    shortId: string,
    scheduleCode?: string,
    medicalReportCode?: string,
    medicalReportExamCode?: string,
    isExternal?: boolean,
    isRedirect?: boolean,
  ): string {
    const accessToken = this.registerMedicalReportDownloadToken(
      integrationId,
      patientErpCode,
      shortId,
      scheduleCode,
      medicalReportCode,
      medicalReportExamCode,
      isExternal,
    );
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/integration/${integrationId}/download-report/medical-report?token=${accessToken}&isRedirect=${!!isRedirect}`;
  }

  public async downloadMedicalReport(integrationId: string, data: DownloadMedicalReportTokenData): Promise<Buffer> {
    return await this.integratorService.downloadMedicalReport(integrationId, data);
  }

  public async getMedicalReportUrl(integrationId: string, data: DownloadMedicalReportTokenData): Promise<string> {
    return await this.integratorService.getMedicalReportUrl(integrationId, data);
  }

  public async listAvailableMedicalReports(
    integrationId: string,
    data: ListAvailableMedicalReportsTokenData,
    filter: ListAvailableMedicalReportsFilterRequest,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReports>> {
    return await this.integratorService.listAvailableMedicalReports(integrationId, data, filter);
  }

  public async listAvailableMedicalReportsByPatientCode(
    integrationId: string,
    data: ListAvailableMedicalReportsTokenData,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReportsByPatientCode>> {
    return this.integratorService.listAvailableMedicalReportsByPatientCode(integrationId, data);
  }

  public async validatePatientReportDownload(
    integrationId: string,
    body: ValidPatientReportDownloadRequest,
  ): Promise<ValidatePatientReportDownloadResponse> {
    const result = await this.integratorService.validatePatientReportDownload(integrationId, body);

    if (result) {
      const token = jwt.sign(body, process.env.SCHEDULING_DOWNLOAD_REPORT_JWT_SECRET_KEY, {
        expiresIn: '30m',
      });
      return { token };
    }

    return { token: undefined };
  }

  public async hasAvailableMedicalReports(
    integrationId: string,
    data: ListSchedules,
    filter: HasAvailableMedicalReportsFilterRequest,
  ): Promise<HasAvailableMedicalReportsFilterResponse> {
    return await this.integratorService.hasAvailableMedicalReports(integrationId, data, filter);
  }

  private registerProcedureGuidanceDownloadToken(
    integrationId: Types.ObjectId,
    patientErpCode: string,
    shortId: string,
    scheduleCode?: string,
  ): string {
    const data: DownloadTokenData = {
      integrationId: castObjectIdToString(integrationId),
      patientErpCode,
      scheduleCode,
      shortId,
    };

    if (scheduleCode) {
      data.scheduleCode = scheduleCode;
    }

    return jwt.sign(data, process.env.SCHEDULING_JWT_SECRET_KEY, {
      expiresIn: '2 days',
    });
  }

  public createProcedureGuidanceDownloadLink(
    integrationId: Types.ObjectId,
    patientErpCode: string,
    shortId: string,
    scheduleCode?: string,
  ): string {
    const accessToken = this.registerProcedureGuidanceDownloadToken(
      integrationId,
      patientErpCode,
      shortId,
      scheduleCode,
    );
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/client/${integrationId}/download?token=${accessToken}`;
  }
}
