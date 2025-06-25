import { CampaignStatus } from '../../campaign/models/campaign.entity';

export interface ListCampaignParams {
    startDate?: number;
    endDate?: number;
    status?: CampaignStatus;
    isTest?: boolean;
    name?: string;
    hasFail?: boolean;
}
