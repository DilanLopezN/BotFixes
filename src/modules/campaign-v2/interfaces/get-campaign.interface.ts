import { Campaign } from "../../campaign/models/campaign.entity";

export interface GetCampaignParams {
    campaignId: number;
}

export interface GetContactResponse {
    id: number;
    name: string;
    phone: string;
    sent?: boolean;
    conversationId?: string;
    [key: string]: string | number | boolean;
}

export interface GetCampaignResponse {
    campaign: Campaign;
    contacts?: GetContactResponse[];
}
