import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { SendScheduleDto } from '../dto/external-send-active-schedule.dto';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as Sentry from '@sentry/node';
import { Exceptions } from '../../../modules/auth/exceptions';
import { ExternalDataService } from '../services/external-data.service';

@Controller('v1/schedules')
export class ExternalController {
    private readonly axiosInstance: AxiosInstance;
    constructor(private readonly externalDataService: ExternalDataService) {
        this.axiosInstance = axios.create();
        axiosRetry(this.axiosInstance, {
            retries: 3, // número de tentativas
            retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
            retryCondition: (error) => {
                return error?.response?.status >= 500 || error?.code === 'ECONNABORTED';
            },
        });
    }

    @Post('sendMessage')
    async sendActiveSchedule(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: SendScheduleDto,
    ): Promise<any> {
        const requestData = {
            ...body,
        };
        try {
            const urlGetWorspaceId = process.env.AUTOMATIC_MESSAGE_URL + `/external/getWorkspaceId`;
            const responseWorkspace = await this.axiosInstance.post(urlGetWorspaceId, requestData);
            const { workspaceId } = responseWorkspace.data;

            const workspaceIsDisable = await this.externalDataService.isWorkspaceDisabled(workspaceId);
            if (workspaceIsDisable) throw Exceptions.WORKSPACE_IS_INACTIVE;

            const url = process.env.AUTOMATIC_MESSAGE_URL + `/external/sendMessage`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ExternalController.name}.sendMessage`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }
}
