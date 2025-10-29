import { FeedbackEnum } from './constants';

export type FeedbackFilter = 'all' | 'withFeedback' | 'noFeedback';

export type RatingDashboardQueryStrings = {
  startDate?: string;
  endDate?: string;
  currentPage?: string;
  pageSize?: string;
  memberId?: string;
  teamIds?: string;
  tags?: string;
  note?: string;
  feedback?: FeedbackEnum;
};

export interface GetRatingsRequest {
  limit: number;
  offset: number;
  timezone: string;
  startDate: string;
  endDate: string;
  tags?: string;
  teamIds?: string;
  memberId?: string;
  value?: number;
  feedback?: FeedbackFilter;
}

export interface Rating {
  id: number;
  value: number;
  ratingFeedback: string | null;
  workspaceId: string;
  conversationId: string;
  teamId: string;
  closedBy: string;
  tags: string[];
  channel: string;
  settingId: number;
  createdAt: string;
  accessedAt: string;
  exitAt: string | null;
  ratingAt: string;
  expiresAt: string | null;
  ratingSendedAt: string | null;

  urlIdentifier: string;
}

export interface GetRatingsResponse {
  data: Rating[];
  count: number;
  avg: number;
  values: {
    note1: number;
    note2: number;
    note3: number;
    note4: number;
    note5: number;
  };
}
