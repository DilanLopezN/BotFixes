import { Body, Controller, Get, Param, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PredefinedRoles } from '../../../common/utils/utils';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { ListDiagnosticExtractionsDto } from '../dto/list-diagnostics-extraction.dto';
import { RunManualExtractionDto } from '../dto/run-manual-extraction.dto';
import { ListExtractDataDto } from '../dto/list-extract-data.dto';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as Sentry from '@sentry/node';
import { ListDiagnosticMatchFlowsDto } from '../dto/list-diagnostics-match-flows.dto';
@ApiTags('Diagnostics')
@Controller('workspaces/:workspaceId/diagnostics')
export class DiagnosticController {
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

    @Post('listDiagnosticExtractions')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async listDiagnosticExtractions(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: ListDiagnosticExtractionsDto,
    ): Promise<any> {
        const requestData = {
            ...body,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/diagnostics/listDiagnosticExtractions`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${DiagnosticController.name}.listDiagnosticExtractions`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }
    @Post('runManualExtraction')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async runManualExtraction(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: RunManualExtractionDto,
    ): Promise<any> {
        const requestData = {
            ...body,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/diagnostics/runManualExtraction`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${DiagnosticController.name}.runManualExtraction`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }
    @Post('listExtractData')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async listExtractData(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: ListExtractDataDto,
    ): Promise<any> {
        const requestData = {
            ...body,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/diagnostics/listExtractData`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${DiagnosticController.name}.listExtractData`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }
    @Post('listMatchFlows')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async listMatchFlows(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: ListDiagnosticMatchFlowsDto,
    ): Promise<any> {
        let requestBody = {
            trigger: body.trigger,
            scheduleIds: body.scheduleIds?.map((id) => Number(id)),
        };
        try {
            const getHeaders = () => {
                const token = process.env.API_TOKEN;
                return {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };
            };
            const url =
                process.env.INTEGRATIONS_URI + `/integration/${body.integrationId}/health/confirmation/matchFlows`;
            const response = await this.axiosInstance.post(url, requestBody, getHeaders());
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${DiagnosticController.name}.listMatchFlows`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }
}
