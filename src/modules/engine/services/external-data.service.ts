import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ContactsAcceptedPrivacyPolicyService } from '../../privacy-policy/services/contacts-accepted-privacy-policy.service';
import { GetAcceptedPrivacyPolicyDto, SetAcceptedPrivacyPolicyDto } from '../dtos/accepted-privacy-policy.dto';
import { PrivacyPolicyService } from '../../privacy-policy/services/privacy-policy.service';
import { TemplateMessageService } from '../../template-message/services/template-message.service';
import { ActivityService } from '../../activity/services/activity.service';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as Sentry from '@sentry/node';
@Injectable()
export class ExternalDataService {
    private readonly axiosInstance: AxiosInstance;

    private contactsAcceptedPrivacyPolicyService: ContactsAcceptedPrivacyPolicyService;
    private privacyPolicyService: PrivacyPolicyService;
    private templateMessageService: TemplateMessageService;
    private activityService: ActivityService;

    constructor(private readonly moduleRef: ModuleRef) {
        this.axiosInstance = axios.create();
        axiosRetry(this.axiosInstance, {
            retries: 3, // número de tentativas
            retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
            retryCondition: (error) => {
                return error?.response?.status >= 500 || error?.code === 'ECONNABORTED';
            },
        });
    }

    async onApplicationBootstrap() {
        this.contactsAcceptedPrivacyPolicyService = this.moduleRef.get<ContactsAcceptedPrivacyPolicyService>(
            ContactsAcceptedPrivacyPolicyService,
            { strict: false },
        );
        this.privacyPolicyService = this.moduleRef.get<PrivacyPolicyService>(PrivacyPolicyService, { strict: false });
        this.templateMessageService = this.moduleRef.get<TemplateMessageService>(TemplateMessageService, {
            strict: false,
        });
        this.activityService = this.moduleRef.get<ActivityService>(ActivityService, {
            strict: false,
        });
    }

    async setAcceptedPrivacyPolicy(workspaceId: string, data: SetAcceptedPrivacyPolicyDto): Promise<void> {
        return await this.contactsAcceptedPrivacyPolicyService.setContactAcceptedByPhoneCacheKey(
            workspaceId,
            data.channelConfigId,
            data.phone,
        );
    }

    async getAcceptedPrivacyPolicyByPhoneFromCache(
        workspaceId: string,
        data: GetAcceptedPrivacyPolicyDto,
    ): Promise<any> {
        return await this.contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(
            workspaceId,
            data.channelConfigId,
            data.phone,
        );
    }

    async getPrivacyPolicyByChannelConfigIdOrChannelConfigToken(workspaceId: string, channelConfigId: string) {
        return await this.privacyPolicyService.getPrivacyPolicyByChannelConfigId(workspaceId, channelConfigId);
    }

    async getTemplateById(templateId: string) {
        return await this.templateMessageService.getOne(templateId);
    }

    async getParsedTemplate(templateId: string, attributes: { key: string; value: string }[]) {
        return await this.templateMessageService.getParsedTemplate(templateId, attributes);
    }

    async getAudioTranscriptionByActivityId(workspaceId: string, activityId: string, createdBy: string) {
        return await this.activityService.transformActivityWithAudioTranscription(workspaceId, activityId, createdBy);
    }

    async getAttributesBySchedule(schedule) {
        const requestData = {
            schedule,
            sendType: 'confirmation', // Antes enviava o ExtractResumeType.confirmation, mas agr envia como string pois o enum está em outro projeto
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule/getAttributes`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ExternalDataService.name}.getAttributes`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    async findCancelReasonByWorkspaceIdAndIds(workspaceId: string, reasonIds: number[]) {
        const requestData = {
            workspaceId,
            ids: reasonIds.map((id) => Number(id)),
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/cancel-reason/findCancelReasonByWorkspaceIdAndIds`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ExternalDataService.name}.findCancelReasonByWorkspaceIdAndIds`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    async getSchedulesByGroupId(workspaceId: string, groupId: string) {
        const requestData = {
            groupId,
            workspaceId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule/getSchedulesByGroupId`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ExternalDataService.name}.getSchedulesByGroupId`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    async getScheduleByScheduleId(workspaceId: string, scheduleId: string) {
        const requestData = {
            workspaceId,
            scheduleId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule/getScheduleByScheduleId`;
            const response = await this.axiosInstance.post(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ExternalDataService.name}.getScheduleByScheduleId`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }
}
