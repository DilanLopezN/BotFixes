import { CampaignStatus } from '~/constants/campaign-status';

export interface GetCampaignListByWorkspaceIdProps {
  skip: number;
  limit: number;
  data: {
    startDate?: number;
    endDate?: number;
    status?: CampaignStatus;
    isTest?: boolean;
    name?: string;
    hasFail?: boolean;
  };
}
