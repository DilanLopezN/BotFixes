import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ChannelConfigService, CompleteChannelConfig } from '../../channel-config/channel-config.service';
import {
    PartnerApiService,
    TemplateCategory,
    TemplateCategory as TemplateCategoryGupshup,
    TemplateTypeGupshup,
} from '../../channels/gupshup/services/partner-api.service';
import { TemplateMessage } from '../interface/template-message.interface';
import { CatchError } from '../../auth/exceptions';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { TeamService } from '../../team/services/team.service';
import { UploadingFile } from '../../../common/interfaces/uploading-file.interface';
import { ActiveMessageSettingService } from '../../active-message/services/active-message-setting.service';
import { CampaignService } from '../../campaign/services/campaign.service';
import axios from 'axios';
import * as Sentry from '@sentry/node';
import { WhatsappBridgeService } from '../../channels/whatsapp/services/whatsapp-bridge.service';
import { ChannelConfig } from '../../channel-config/interfaces/channel-config.interface';
import { FlowDataService } from '../../whatsapp-flow/services/flow-data.service';

@Injectable()
export class ExternalDataService {
    private channelConfigService: ChannelConfigService;
    private partnerApiService: PartnerApiService;
    private workspacesService: WorkspacesService;
    private teamService: TeamService;
    private activeMessageSettingService: ActiveMessageSettingService;
    private campaignService: CampaignService;
    private flowDataService: FlowDataService;
    private whatsappBridgeService: WhatsappBridgeService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
        this.partnerApiService = this.moduleRef.get<PartnerApiService>(PartnerApiService, { strict: false });
        this.workspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        this.teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        this.activeMessageSettingService = this.moduleRef.get<ActiveMessageSettingService>(
            ActiveMessageSettingService,
            { strict: false },
        );
        this.campaignService = this.moduleRef.get<CampaignService>(CampaignService, { strict: false });
        this.flowDataService = this.moduleRef.get<FlowDataService>(FlowDataService, { strict: false });
        this.whatsappBridgeService = this.moduleRef.get<WhatsappBridgeService>(WhatsappBridgeService, {
            strict: false,
        });
    }

    async getChannelConfigByWorkspaceIdAndGupshup(workspaceId: string) {
        return await this.channelConfigService.getChannelConfigByWorkspaceIdAndGupshup(workspaceId);
    }

    async getOneByToken(channelConfigToken: string) {
        return await this.channelConfigService.getOneByToken(channelConfigToken);
    }

    async createTemplateGupshup(
        appName: string,
        channelConfigId: string,
        template: TemplateMessage,
        allowTemplateCategoryChange?: boolean,
        category?: TemplateCategoryGupshup,
        file?: UploadingFile,
        templateType?: TemplateTypeGupshup,
    ) {
        return await this.partnerApiService.createTemplate(
            appName,
            channelConfigId,
            template,
            allowTemplateCategoryChange,
            category,
            file,
            templateType,
        );
    }

    @CatchError()
    async deleteTemplateGupshup(appName: string, elementName: string) {
        return await this.partnerApiService.deleteTemplate(appName, elementName);
    }

    @CatchError()
    async listTemplateGupshup(appName: string) {
        return await this.partnerApiService.listTemplate(appName);
    }

    async getWorkspace(workspaceId: string) {
        return await this.workspacesService.getOne(workspaceId);
    }

    async getTeamsByWorkspaceAndUser(workspaceId: string, userId: string) {
        return await this.teamService.getTeamsByWorkspaceAndUser(workspaceId, userId);
    }

    async checkActiveMessageTemplateUsage(workspaceId: string, templateId: string) {
        return await this.activeMessageSettingService.checkTemplateUsage(workspaceId, templateId);
    }

    async checkCampaignTemplateUsage(workspaceId: string, templateId: string) {
        return await this.campaignService.checkTemplateUsage(workspaceId, templateId);
    }

    async checkScheduleTemplateUsage(workspaceId: string, templateId: string): Promise<boolean> {
        const requestData = {
            workspaceId,
            templateId,
        };
        try {
            const url = process.env.AUTOMATIC_MESSAGE_URL + `/schedule-setting/checkScheduleTemplateUsage`;
            const response = await axios.post<boolean>(url, requestData);
            return response.data;
        } catch (error) {
            Sentry.captureEvent({
                message: `${ExternalDataService.name}.checkScheduleTemplateUsage`,
                extra: {
                    error,
                },
            });
            throw error;
        }
    }

    async getFlowDataByWorkspaceIdAndId(workspaceId: string, id: number) {
        const result = await this.flowDataService.getFlowDataByWorkspaceIdAndId(workspaceId, id);

        return result.data;
    }

    async createTemplateMetaWhatsapp(
        channelConfig: ChannelConfig,
        name: string,
        category: TemplateCategory,
        template: any,
        fileData?: any,
    ) {
        const completeChannelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfig.token);
        return await this.whatsappBridgeService.createTemplateMetaWhatsapp(
            completeChannelConfig,
            name,
            category,
            template,
            fileData,
        );
    }
}
