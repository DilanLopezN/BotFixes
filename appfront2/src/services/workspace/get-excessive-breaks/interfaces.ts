import { NewResponseModel } from '~/interfaces/new-response-model';

export interface GetExcessiveBreaksProps {
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  breakSettingId?: number | null;
}

export interface ExcessiveBreak {
  id: number;
  userId: string;
  userName: string;
  startedAt: string;
  breakName: string;
  breakSettingId: string;
  overtimeSeconds: number;
  justification?: string;
}

export type GetExcessiveBreaksResponse = NewResponseModel<ExcessiveBreak[]>;
