import { SendingListQueryParams } from '~/interfaces/send-list-query-params';

export interface GetNpsAnalyticsByWorkspaceIdParams extends SendingListQueryParams {}

export interface NpsAnalytic {
  nps_score: string;
  count: number;
}
