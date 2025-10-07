import {
  Body,
  Controller,
  Param,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ScheduleAnalyticsFiltersDto } from '../dto/schedule-analytics-filters.dto';
import { ScheduleAnalyticsService } from '../services/schedule-analytics.service';
import {
  ResultNpsScheduleAnalytics,
  ResultScheduleAnalytics,
  ResultScheduleCancelReasonAnalytics,
} from '../interfaces/schedule-analytics-filters';
import { ExtractResumeType } from '../../models/extract-resume.entity';
import { ScheduleFilterListDto } from '../../dto/schedule-query.dto';
import {
  downloadFileType,
  typeDownloadEnum,
} from '../../../miscellaneous/utils';
import { TimeoutInterceptor } from '../../../miscellaneous/interceptors/timeout.interceptor';
import { ScheduleExportDto } from '../../dto/schedule-export.dto';

@Controller('schedule-analytics')
export class ScheduleAnalyticsController {
  constructor(
    private readonly scheduleAnalyticsService: ScheduleAnalyticsService,
  ) {}

  @Post('/metrics')
  async getScheduleMetrics(
    @Body(new ValidationPipe()) filter: ScheduleAnalyticsFiltersDto,
  ): Promise<
    ResultScheduleAnalytics | ResultScheduleAnalytics[ExtractResumeType]
  > {
    return await this.scheduleAnalyticsService.getAllScheduleMetrics({
      ...filter,
      workspaceId: filter.workspaceId,
    });
  }

  @Post('/metricsCancelReason')
  async getScheduleMetricsCancelReason(
    @Body(new ValidationPipe()) filter: ScheduleAnalyticsFiltersDto,
  ): Promise<ResultScheduleCancelReasonAnalytics[]> {
    return await this.scheduleAnalyticsService.getScheduleMetricsCancelReason({
      ...filter,
      workspaceId: filter.workspaceId,
    });
  }

  @Post('/exportCsv')
  @UseInterceptors(new TimeoutInterceptor(120000))
  async listSchedulesCsv(@Body(new ValidationPipe()) dto: ScheduleExportDto) {
    const { filter, selectedColumns } = dto;

    const result = await this.scheduleAnalyticsService.listSchedulesCsv(
      {
        ...filter,
        workspaceId: filter.workspaceId,
      },
      selectedColumns,
    );

    return result;
  }

  @Post('/metricsNpsSchedule')
  async getScheduleMetricsNpsSchedule(
    @Body(new ValidationPipe()) filter: ScheduleAnalyticsFiltersDto,
  ): Promise<ResultNpsScheduleAnalytics[]> {
    return await this.scheduleAnalyticsService.getScheduleMetricsNpsSchedule({
      ...filter,
      workspaceId: filter.workspaceId,
    });
  }
}
