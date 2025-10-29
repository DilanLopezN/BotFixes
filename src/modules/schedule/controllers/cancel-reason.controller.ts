import { Body, Controller, Get, Param, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PredefinedRoles } from '../../../common/utils/utils';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { CreateCancelReasonDto, UpdateCancelReasonDto } from '../dto/cancel-reason.dto';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as Sentry from '@sentry/node';
@ApiTags('CancelReason')
@Controller('cancel-reason')
export class CancelReasonController {
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

    @Post('workspaces/:workspaceId/create')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async create(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: CreateCancelReasonDto,
    ): Promise<any> {
        const requestData = {
            ...body,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/cancel-reason/create`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${CancelReasonController.name}.create`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    @Put('workspaces/:workspaceId/reasonId/:reasonId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async update(
        @Param('workspaceId') workspaceId: string,
        @Param('reasonId') reasonId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: UpdateCancelReasonDto,
    ): Promise<any> {
        const requestData = {
            ...body,
            workspaceId,
            id: Number(reasonId),
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/cancel-reason/update`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${CancelReasonController.name}.update`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    @Get('/workspaces/:workspaceId/list')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async listByWorkspaceId(@Param('workspaceId') workspaceId: string): Promise<any> {
        const requestData = {
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/cancel-reason/list`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${CancelReasonController.name}.list`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    //Por enquanto comentado pois não sabemos onde está sendo usado
    // @Post('/workspaces/:workspaceId/get-cancel-reasons')
    // @RolesDecorator([
    //     PredefinedRoles.SYSTEM_ADMIN,
    //     PredefinedRoles.SYSTEM_DEV_ADMIN,
    //     PredefinedRoles.SYSTEM_CS_ADMIN,
    //     PredefinedRoles.SYSTEM_UX_ADMIN,
    // ])
    // @UseGuards(AuthGuard, RolesGuard)
    // @ApiOperation({ summary: 'Get cancel reasons by workspace ID' })
    // @ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String, required: true })
    // @ApiBody({
    //     description: 'Get cancel reasons parameters',
    //     type: DefaultRequest<ListScheduleCancelReasonParams>,
    // })
    // async getCancelReasons(
    //     @Param('workspaceId') workspaceId: string,
    //     @Body() body: DefaultRequest<ListScheduleCancelReasonParams>,
    // ): Promise<any> {
    //     const requestData = {
    //         ...body,
    //         workspaceId,
    //     };
    //     try {
    //         const url = process.env.AUTOMATIC_MESSAGE_URL + `/cancel-reason/find`;
    //         const response = await this.axiosInstance.post(url, requestData);
    //         return response.data;
    //     } catch (error) {
    //         Sentry.captureEvent({
    //             message: `${CancelReasonController.name}.find`,
    //             extra: {
    //                 error,
    //             },
    //         });
    //         throw error;
    //     }
    // }

    @Get('workspaces/:workspaceId/reasonId/:reasonId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.SYSTEM_SUPPORT_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async findOne(@Param('workspaceId') workspaceId: string, @Param('reasonId') reasonId: string): Promise<any> {
        const requestData = {
            workspaceId,
            reasonId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/cancel-reason/get`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${CancelReasonController.name}.get`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }
}
