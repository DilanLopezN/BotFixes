import { GetCampaignResponse } from './get-campaign.interface';

export interface CampaignSendDetailsParams {
    campaignId: number;
}

export interface CampaignSendDetailsResponse {
    campaign: GetCampaignResponse;
    sendDetails: {
        name: string;
        phone: string;
        conversationId: string;
    }[];
}
