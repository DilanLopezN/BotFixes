import { CampaignType } from "../models/campaign.entity";

export interface CreateCampaignData {
    name: string;
    description?: string;
    templateId?: string;
    sendAt?: number;
    sendInterval?: number;
    campaignType?: CampaignType;
    workspaceId: string;
    activeMessageSettingId?: number;
    clonedFrom?: number;
    isTest?: boolean;
}