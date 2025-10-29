import { FeedbackEnum } from '~/modules/dashboard/rating-dashboard/constants';

export interface ExportRatingsRequest {
  startDate: string;
  endDate: string;
  timezone: string;
  downloadType: 'csv' | 'xlsx';
  memberId?: string;
  teamIds?: string;
  tags?: string;
  value?: number;
  feedback?: FeedbackEnum;
}
