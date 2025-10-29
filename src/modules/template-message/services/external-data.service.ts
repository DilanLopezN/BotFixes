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
    private _channelConfigService: ChannelConfigService;
    private _partnerApiService: PartnerApiService;
    private _workspacesService: WorkspacesService;
    private _teamService: TeamService;
    private _activeMessageSettingService: ActiveMessageSettingService;
    private _campaignService: CampaignService;
    private _flowDataService: FlowDataService;
    private _whatsappBridgeService: WhatsappBridgeService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get channelConfigService(): ChannelConfigService {
        if (!this._channelConfigService) {
            this._channelConfigService = this.moduleRef.get<ChannelConfigService>(ChannelConfigService, { strict: false });
        }
        return this._channelConfigService;
    }

    private get partnerApiService(): PartnerApiService {
        if (!this._partnerApiService) {
            this._partnerApiService = this.moduleRef.get<PartnerApiService>(PartnerApiService, { strict: false });
        }
        return this._partnerApiService;
    }

    private get workspacesService(): WorkspacesService {
        if (!this._workspacesService) {
            this._workspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        }
        return this._workspacesService;
    }

    private get teamService(): TeamService {
        if (!this._teamService) {
            this._teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        }
        return this._teamService;
    }

    private get activeMessageSettingService(): ActiveMessageSettingService {
        if (!this._activeMessageSettingService) {
            this._activeMessageSettingService = this.moduleRef.get<ActiveMessageSettingService>(
                ActiveMessageSettingService,
                { strict: false },
            );
        }
        return this._activeMessageSettingService;
    }

    private get campaignService(): CampaignService {
        if (!this._campaignService) {
            this._campaignService = this.moduleRef.get<CampaignService>(CampaignService, { strict: false });
        }
        return this._campaignService;
    }

    private get flowDataService(): FlowDataService {
        if (!this._flowDataService) {
            this._flowDataService = this.moduleRef.get<FlowDataService>(FlowDataService, { strict: false });
        }
        return this._flowDataService;
    }

    private get whatsappBridgeService(): WhatsappBridgeService {
        if (!this._whatsappBridgeService) {
            this._whatsappBridgeService = this.moduleRef.get<WhatsappBridgeService>(WhatsappBridgeService, {
                strict: false,
            });
        }
        return this._whatsappBridgeService;
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
        file?: UploadingFile,
        templateType?: any,
        allowTemplateCategoryChange?: boolean,
    ) {
        const completeChannelConfig = await this.channelConfigService.getOneBtIdOrToken(channelConfig.token);
        return await this.whatsappBridgeService.createTemplateMetaWhatsapp(
            completeChannelConfig,
            name,
            category,
            template,
            fileData,
            file,
            templateType,
            allowTemplateCategoryChange,
        );
    }
}
