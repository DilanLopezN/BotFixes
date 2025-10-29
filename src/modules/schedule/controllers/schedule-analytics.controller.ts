import { Body, Controller, Param, Post, Res, UseGuards, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from './../../auth/guard/auth.guard';
import { RolesGuard } from './../../users/guards/roles.guard';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../../common/utils/utils';
import { AutomaticSendingListFeatureFlagGuard } from '../guards/automatic-sending-list-feature-flag.guard';
import { TimeoutInterceptor } from '../../../common/interceptors/timeout.interceptor';
import { ScheduleFilterListDto } from '../dto/schedule-query.dto';
import { downloadFileType, typeDownloadEnum } from '../../../common/utils/downloadFileType';
import { ScheduleAnalyticsFiltersDto } from '../dto/schedule-analytics-filters.dto';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as Sentry from '@sentry/node';
import { ScheduleExportDto } from '../dto/schedule-export.dto';
// import { AgentStatusVerifyBreakGuard } from '../../agent-status/guards/agent-status-verify-break.guard';

@Controller('workspaces/:workspaceId/schedule-analytics')
@UseGuards(AuthGuard)
export class ScheduleAnalyticsController {
    private readonly axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create();
        axiosRetry(this.axiosInstance, {
            retries: 3, // número de tentativas
            retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
            retryCondition: (error) => {
                return error?.response?.status >= 500 || error?.code === 'ECONNABORTED';
            },
        });
    }

    @Post('/metrics')
    @UseGuards(RolesGuard, AutomaticSendingListFeatureFlagGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    async getScheduleMetrics(
        @Param('workspaceId') workspaceId: string,
        @Body() filter: ScheduleAnalyticsFiltersDto,
    ): Promise<any> {
        const requestData = {
            ...filter,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-analytics/metrics`;
            const response = await axios.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleAnalyticsController.name}.metrics`,
                extra: {
                    error,
                },
            });
            throw error?.response?.data || error;
        }
    }

    @Post('/metrics-cancel-reason')
    @UseGuards(RolesGuard, AutomaticSendingListFeatureFlagGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    async getScheduleMetricsCancelReason(
        @Param('workspaceId') workspaceId: string,
        @Body() filter: ScheduleAnalyticsFiltersDto,
    ): Promise<any> {
        const requestData = {
            ...filter,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-analytics/metricsCancelReason`;
            const response = await axios.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleAnalyticsController.name}.metricsCancelReason`,
                extra: {
                    error,
                },
            });
            throw error?.response?.data || error;
        }
    }

    @Post('/schedules/export-csv')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard, AutomaticSendingListFeatureFlagGuard)
    @UseInterceptors(new TimeoutInterceptor(120000))
    async listSchedulesCsv(
        @Param('workspaceId') workspaceId: string,
        @Body() dto: ScheduleExportDto,
        @Res() response,
    ): Promise<any> {
        const { filter, selectedColumns, downloadType } = dto;

        const requestData = {
            filter: {
                ...(dto?.filter || dto || {}),
                workspaceId,
            },
            selectedColumns: selectedColumns || [],
            downloadType: downloadType || typeDownloadEnum.CSV,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-analytics/exportCsv`;
            const data = await axios.post(url, requestData);
            //dependendo do tamanho do arquivo, isso deveria ser devolvido em forma de stream pra acontecer o efeito de "baixando"
            // para o usuário. esse retorno da a sensação de que está demorando por não ter feedback
            return downloadFileType(downloadType, data.data, response, 'relatorio-atendimentos');
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleAnalyticsController.name}.exportCsv`,
                extra: {
                    error,
                },
            });
            throw error?.response?.data || error;
        }
    }

    @Post('/metrics-nps-schedule')
    @UseGuards(RolesGuard, AutomaticSendingListFeatureFlagGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    async getScheduleMetricsNpsSchedule(
        @Param('workspaceId') workspaceId: string,
        @Body() filter: ScheduleAnalyticsFiltersDto,
    ): Promise<any> {
        const requestData = {
            ...filter,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-analytics/metricsNpsSchedule`;
            const response = await axios.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleAnalyticsController.name}.metricsNpsSchedule`,
                extra: {
                    error,
                },
            });
            throw error?.response?.data || error;
        }
    }
}
