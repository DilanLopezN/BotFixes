import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ObjectIdPipe } from '../../../common/pipes/objectId.pipe';
import { StringPipe } from '../../../common/pipes/string.pipe';
import { decodeToken } from '../../../common/helpers/decode-token';
import { ScheduleEventType } from '../interfaces/scheduling-events.interface';
import { SchedulingEventsService } from '../services/scheduling-events.service';
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
import { DownloadMedicalReportTokenData } from '../interfaces/download-token.interface';
import { ApiTags } from '@nestjs/swagger';
import { SchedulingDownloadReportService } from '../services/scheduling-download-report.service';
import { SchedulingAuthGuard } from '../../../common/guards/scheduling.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SchedulingDownloadReportAuthGuard } from '../../../common/guards/scheduling.download.guard';
import { ListSchedules } from '../interfaces/list-schedules.interface';
import { BooleandPipe } from '../../../common/pipes/boolean.pipe';

@ApiTags('Download-Medical-Report')
@Controller({
  path: 'integration/:integrationId/download-report',
})
export class SchedulingDownloadReportController {
  constructor(
    private readonly schedulingEventsService: SchedulingEventsService,
    private readonly schedulingDownloadReportService: SchedulingDownloadReportService,
  ) {}

  @UseGuards(SchedulingAuthGuard)
  @Post('listAvailableMedicalReports')
  async listAvailableMedicalReports(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query('token', StringPipe) authToken: string,
    @Body() filter?: ListAvailableMedicalReportsFilterRequest,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReports>> {
    const authData = decodeToken<ListAvailableMedicalReportsTokenData>(
      authToken,
      process.env.SCHEDULING_DOWNLOAD_REPORT_JWT_SECRET_KEY,
    );

    if (!authData?.patientCpf || !authData?.patientCode || !authData?.shortId || !authData?.patientBirthDate) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    return await this.schedulingDownloadReportService.listAvailableMedicalReports(integrationId, authData, filter);
  }

  @UseGuards(SchedulingAuthGuard)
  @Post('listAvailableMedicalReportsByPatientCode')
  async listAvailableMedicalReportsByPatientCode(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query('token', StringPipe) authToken: string,
  ): Promise<CountAvailableMedicalReportsResponse<ListAvailableMedicalReportsByPatientCode>> {
    const authData = decodeToken<ListAvailableMedicalReportsTokenData>(
      authToken,
      process.env.SCHEDULING_DOWNLOAD_REPORT_JWT_SECRET_KEY,
    );

    if (!authData?.patientCode || !authData?.shortId) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    return this.schedulingDownloadReportService.listAvailableMedicalReportsByPatientCode(integrationId, authData);
  }

  @UseGuards(SchedulingDownloadReportAuthGuard)
  @Get('medical-report')
  async downloadMedicalReport(
    @Res() res: Response,
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Query('token', StringPipe) token: string,
    @Query('isRedirect', BooleandPipe) isRedirect: boolean,
  ): Promise<void> {
    const data = decodeToken<DownloadMedicalReportTokenData>(
      token,
      process.env.SCHEDULING_DOWNLOAD_REPORT_JWT_SECRET_KEY,
    );

    if (!data?.integrationId || !data?.patientErpCode) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    const result = isRedirect
      ? await this.schedulingDownloadReportService.getMedicalReportUrl(integrationId, data)
      : await this.schedulingDownloadReportService.downloadMedicalReport(integrationId, data);

    try {
      await this.schedulingEventsService.createEvent({
        integrationId,
        shortId: data.shortId,
        type: ScheduleEventType.downloadReport,
        scheduleCode: data.scheduleCode || undefined,
      });
    } catch (error) {
      console.error(error);
    }

    if (isRedirect) {
      res.redirect(result as string);
    } else {
      const buffer = result as Buffer;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Laudo${
          (data.scheduleCode ? '_' + data.scheduleCode : '') +
          (data.medicalReportExamCode ? '_' + data.medicalReportExamCode : '') +
          (data.medicalReportCode ? '_' + data.medicalReportCode : '')
        }.pdf`,
      );

      res.end(buffer);
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(SchedulingAuthGuard, ThrottlerGuard)
  @Post('validatePatientMedicalReportDownload')
  async validatePatientReportDownload(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) body: ValidPatientReportDownloadRequest,
    @Headers('Authorization') token: string,
  ): Promise<ValidatePatientReportDownloadResponse> {
    if (!body?.patientCpf) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos',
        },
      });
    }

    const data = decodeToken<ListSchedules>(token, process.env.SCHEDULING_JWT_SECRET_KEY);

    return this.schedulingDownloadReportService.validatePatientReportDownload(integrationId, {
      ...body,
      shortId: data.shortId,
      patientCode: data.patientErpCode,
    });
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(SchedulingAuthGuard)
  @Post('hasAvailableMedicalReports')
  async hasAvailableMedicalReports(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Headers('Authorization') token: string,
    @Body() filter: HasAvailableMedicalReportsFilterRequest,
  ): Promise<HasAvailableMedicalReportsFilterResponse> {
    const data = decodeToken<ListSchedules>(token, process.env.SCHEDULING_JWT_SECRET_KEY);

    if (!data?.patientErpCode || !data?.shortId || !filter?.scheduleCode) {
      throw new BadRequestException({
        type: 'error',
        messages: {
          pt: 'Parâmetros inválidos ou faltantes',
        },
      });
    }

    try {
      return await this.schedulingDownloadReportService.hasAvailableMedicalReports(integrationId, data, filter);
    } catch (error) {
      console.error(error);
    }

    return { ok: false };
  }
}
