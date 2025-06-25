import { Injectable } from '@nestjs/common';
import { CatchError } from '../../auth/exceptions';
import { CreateActiveMessageSettingData } from '../interfaces/create-active-message-setting-data.interface';
import { v4 } from 'uuid';
import { UpdateActiveMessageSettingData } from '../interfaces/update-active-message-setting-data.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveMessageSetting, ObjectiveType } from '../models/active-message-setting.entity';
import { ACTIVE_MESSAGE_CONNECTION } from '../ormconfig';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DEFAULT_CONTACT_LIST_LIMITS } from '../../campaign/models/campaign.entity';

@Injectable()
export class ActiveMessageSettingService {
    constructor(
        @InjectRepository(ActiveMessageSetting, ACTIVE_MESSAGE_CONNECTION)
        public activeMessageRepository: Repository<ActiveMessageSetting>,
    ) {}

    @CatchError()
    async findByApiToken(apiToken: string) {
        return await this.activeMessageRepository.findOne({
            apiToken,
        });
    }

    @CatchError()
    async create(data: CreateActiveMessageSettingData) {
        const dataField = {
            ...(data.data || {}),
        };
        if (data.objective === ObjectiveType.campaign) {
            dataField.contactListLimit = data.data?.contactListLimit || DEFAULT_CONTACT_LIST_LIMITS.NORMAL_LIST_LIMIT;
        }

        const newData: QueryDeepPartialEntity<ActiveMessageSetting> = {
            callbackUrl: data.callbackUrl,
            apiToken: v4(),
            settingName: data.settingName,
            channelConfigToken: data.channelConfigToken,
            enabled: data.enabled,
            expirationTime: data.expirationTime,
            expirationTimeType: data.expirationTimeType,
            suspendConversationUntilTime: data.suspendConversationUntilTime,
            suspendConversationUntilType: data.suspendConversationUntilType,
            sendMessageToOpenConversation: data.sendMessageToOpenConversation,
            workspaceId: data.workspaceId,
            tags: data.tags,
            templateId: data.templateId,
            action: data.action,
            objective: data.objective || ObjectiveType.api,
            authorizationHeader: data.authorizationHeader,
            endMessage: data.endMessage,
            data: dataField,
        };

        return await this.activeMessageRepository.insert(newData);
    }

    @CatchError()
    async listByWorkspaceId(workspaceId: string, query?: { objective: ObjectiveType }) {
        const settingList = await this.activeMessageRepository.find({
            workspaceId,
            ...query,
        });
        return settingList;
    }

    @CatchError()
    async listEnabledByWorkspaceId(workspaceId: string, objective?: ObjectiveType) {
        let query: any = {};

        if (objective) {
            query.objective = objective;
        }
        const settingList = await this.activeMessageRepository.find({
            workspaceId,
            enabled: true,
            ...query,
        });
        return settingList;
    }

    @CatchError()
    async update(data: UpdateActiveMessageSettingData) {
        return await this.activeMessageRepository.update(
            {
                id: data.id,
            },
            {
                enabled: data.enabled,
                callbackUrl: data.callbackUrl,
                expirationTime: data.expirationTime,
                expirationTimeType: data.expirationTimeType,
                sendMessageToOpenConversation: data.sendMessageToOpenConversation,
                suspendConversationUntilTime: data.suspendConversationUntilTime,
                suspendConversationUntilType: data.suspendConversationUntilType,
                channelConfigToken: data.channelConfigToken,
                settingName: data.settingName,
                tags: data.tags,
                action: data.action,
                templateId: data.templateId,
                objective: data.objective,
                authorizationHeader: data.authorizationHeader,
                endMessage: data.endMessage,
                data: data.data,
            },
        );
    }

    @CatchError()
    async getOne(id: number) {
        const setting = await this.activeMessageRepository.findOne({
            id: id,
        });
        return setting;
    }

    @CatchError()
    async delete(id: number) {
        return await this.activeMessageRepository.delete({
            id,
        });
    }

    @CatchError()
    async checkTemplateUsage(workspaceId: string, templateId: string) {
        const activeMessageSetting = await this.activeMessageRepository.findOne({
            workspaceId,
            templateId,
        });

        return !!activeMessageSetting;
    }
}
