import { BadRequestException, Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { CreateScheduleSettingDto, UpdateScheduleSettingDto } from '../dto/schedule-setting.dto';
import { RolesGuard } from '../../users/guards/roles.guard';
import { UpdateConfirmationSettingData } from '../interfaces/confirmation-setting-data.interface';
import { UpdateScheduleSettingData } from '../interfaces/schedule-setting-data.interface';
import { UpdateReminderSettingData } from '../interfaces/reminder-setting-data.interface';
import { CreateConfirmationSettingDto } from '../dto/confirmation-setting.dto';
import { CreateReminderSettingDto } from '../dto/reminder-setting.dto';
import { UpdateSendSettingData } from '../interfaces/send-setting-data.interface';
import { CreateSendSettingDto } from '../dto/send-setting.dto';
import { ToggleSettingActiveDto } from '../dto/toggle-setting-active.dto';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as Sentry from '@sentry/node';
import { UserDecorator } from '../../../decorators/user.decorator';
import { User, UserRoles } from '../../users/interfaces/user.interface';

@Controller('workspaces')
export class ScheduleSettingController {
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

    @Post(':workspaceId/schedule-setting')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async createScheduleSetting(
        @Param('workspaceId') workspaceId: string,
        @Body() body: CreateScheduleSettingDto,
    ): Promise<any> {
        const requestData = {
            ...body,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/create`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleSettingController.name}.createScheduleSetting`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    @Put(':workspaceId/schedule-setting/:scheduleSettingId')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async updateScheduleSetting(
        @Param('workspaceId') workspaceId: string,
        @Param('scheduleSettingId') scheduleSettingId: number,
        @Body() body: UpdateScheduleSettingDto,
    ): Promise<any> {
        const requestData = {
            name: body.name,
            alias: body.alias,
            getScheduleInterval: body.getScheduleInterval,
            integrationId: body.integrationId,
            id: scheduleSettingId,
            workspaceId,
            extractAt: body.extractAt,
            extractRule: body.extractRule,
            useSpecialityOnExamMessage: body.useSpecialityOnExamMessage,
            sendOnlyPrincipalExam: body.sendOnlyPrincipalExam,
            enableSendRetry: body.enableSendRetry,
            enableResendNotAnswered: body.enableResendNotAnswered,
            useOrganizationUnitOnGroupDescription: body.useOrganizationUnitOnGroupDescription,
            omitAppointmentTypeName: body.omitAppointmentTypeName,
            omitExtractGuidance: body.omitExtractGuidance,
            fridayJoinWeekendMonday: body.fridayJoinWeekendMonday,
            checkScheduleChanges: body.checkScheduleChanges,
            omitTimeOnGroupDescription: body.omitTimeOnGroupDescription,
            timeResendNotAnswered: body.timeResendNotAnswered,
            useIsFirstComeFirstServedAsTime: body.useIsFirstComeFirstServedAsTime,
            useSendFullDay: body.useSendFullDay,
            externalExtract: body.externalExtract,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/update`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleSettingController.name}.updateScheduleSetting`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    @Get(':workspaceId/schedule-setting')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async listScheduleSetting(@Param('workspaceId') workspaceId: string): Promise<any> {
        const requestData = {
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/list`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleSettingController.name}.listScheduleSetting`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    @Get(':workspaceId/schedule-setting-with-alias')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
        PredefinedRoles.DASHBOARD_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async listScheduleSettingWithAlias(@Param('workspaceId') workspaceId: string): Promise<any> {
        const requestData = {
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/listByAlias`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleSettingController.name}.listScheduleSettingWithAlias`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    @Get(':workspaceId/schedule-setting/:scheduleSettingId')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async scheduleSettingByIdAndWorkspace(
        @Param('workspaceId') workspaceId: string,
        @Param('scheduleSettingId') scheduleSettingId: number,
    ): Promise<any> {
        const requestData = {
            workspaceId,
            scheduleSettingId: Number(scheduleSettingId),
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/getById`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleSettingController.name}.scheduleSettingByIdAndWorkspace`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    @Post(':workspaceId/schedule-setting/create-all-settings')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async createAllSettings(
        @Param('workspaceId') workspaceId: string,
        @Body()
        body: {
            schedule: CreateScheduleSettingDto;
            confirmation: CreateConfirmationSettingDto;
            reminder: CreateReminderSettingDto;
            sendSettings?: CreateSendSettingDto[];
        },
        @UserDecorator() user: User,
    ): Promise<any> {
        let isSystemAdmin = user?.roles?.some((role) => role.role === UserRoles.SYSTEM_ADMIN);

        const requestData = {
            ...body,
            workspaceId,
            ...(isSystemAdmin ? { userRole: UserRoles.SYSTEM_ADMIN } : {}),
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/createAllSettings`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleSettingController.name}.createAllSettings`,
                extra: {
                    error,
                },
            });
            const errorMessage =
                error.response?.data?.message || error.message || 'Erro ao criar configurações de agendamento';

            throw new BadRequestException(errorMessage);
        }
    }

    @Put(':workspaceId/schedule-setting/:scheduleSettingId/update-all-settings')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async updateConfirmationSettingAndScheduleSetting(
        @Param('workspaceId') workspaceId: string,
        @Param('scheduleSettingId') scheduleSettingId: number,
        @Body()
        body: {
            confirmation: UpdateConfirmationSettingData;
            schedule: UpdateScheduleSettingData;
            reminder: UpdateReminderSettingData;
            sendSettings?: UpdateSendSettingData[];
        },
    ): Promise<any> {
        const requestData = {
            ...body,
            workspaceId,
            scheduleSettingId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/updateAllSettings`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleSettingController.name}.updateConfirmationSettingAndScheduleSetting`,
                extra: {
                    error,
                },
            });
            const errorMessage =
                error.response?.data?.message || error.message || 'Erro ao atualizar configurações de agendamento';

            throw new BadRequestException(errorMessage);
        }
    }

    @Post(':workspaceId/schedule-setting/toggle-active')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async toggleSettingActive(
        @Param('workspaceId') workspaceId: string,
        @Body() body: ToggleSettingActiveDto,
        @UserDecorator() user: User,
    ): Promise<any> {
        let isSystemAdmin = user?.roles?.some((role) => role.role === UserRoles.SYSTEM_ADMIN);

        const requestData = {
            id: body.id,
            workspaceId,
            active: body.active,
            settingType: body.settingType,
            type: body.type,
            ...(isSystemAdmin ? { userRole: UserRoles.SYSTEM_ADMIN } : {}),
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/toggle-active`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ScheduleSettingController.name}.toggleSettingActive`,
                extra: {
                    error,
                },
            });
            const errorMessage =
                error.response?.data?.message || error.message || 'Erro ao ativar/desativar configuração';

            throw new BadRequestException(errorMessage);
        }
    }
}
