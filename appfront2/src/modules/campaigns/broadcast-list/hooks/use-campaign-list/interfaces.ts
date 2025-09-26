import type { Dayjs } from 'dayjs';
import { CampaignStatus } from '~/constants/campaign-status';

export interface UseCampaignListProps {
  startDate?: Dayjs;
  endDate?: Dayjs;
  search?: string;
  status?: CampaignStatus;
  pageSize: number;
  currentPage: number;
  hasFail?: boolean;
  isTest?: boolean;
}
