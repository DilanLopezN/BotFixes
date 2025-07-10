import { Body, Controller, HttpStatus, Logger, Param, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { ScheduleFilterListDto, ScheduleResultDto } from '../dto/schedule-query.dto';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedModelDto } from '../../../common/interfaces/paginated';
import { AutomaticSendingListFeatureFlagGuard } from '../guards/automatic-sending-list-feature-flag.guard';
//Usa axios nativo pq precisa de gambiarra pra fazer funcionar o httpmodule com 2 instancias do axios
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as Sentry from '@sentry/node';

@Controller('workspaces')
@ApiTags('schedules')
export class ScheduleController {
    private readonly logger = new Logger(ScheduleController.name);
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

    @Post('/:workspaceId/schedules')
    @ApiQuery({ name: 'skip', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
    ])
    @ApiResponse({ type: PaginatedModelDto<ScheduleResultDto>, status: HttpStatus.OK })
    @UseGuards(AuthGuard, RolesGuard, AutomaticSendingListFeatureFlagGuard)
    async listScheduleSetting(
        @Query('limit') limit: string,
        @Query('skip') skip: string,
        @Param('workspaceId') workspaceId: string,
        @Body() filter: ScheduleFilterListDto,
    ) {
        const requestData = {
            limit: Number(limit || 0),
            skip: Number(skip || 10),
            workspaceId,
            ...filter,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule/list`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleController.name}.listScheduleSetting`,
                extra: {
                    error,
                },
            });
            throw error?.response?.data || error;
        }
    }
}
