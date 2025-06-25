import { CreateCampaignData } from "../../campaign/interfaces/create-campaign-data.interface";

export interface UpdateCampaignData extends CreateCampaignData {
    id: number;
    activeMessageSettingId?: number;
    isTest?: boolean;
}