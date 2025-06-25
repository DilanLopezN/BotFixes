import { CreateCampaignParams } from './create-campaign.interface';

export interface UpdateCampaignParams extends CreateCampaignParams {
    id: number;
}

export interface UpdateCampaignResponse {
    ok: boolean;
}
