import { AnalyticsGroupBy } from '~/constants/analytics-group-by';
import { AnalyticsInterval } from '~/constants/analytics-interval';
import type { NewRequestModel } from '~/interfaces/new-request-model';

export interface GetAgentStatusProps {
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  groupDateBy?: AnalyticsInterval;
  groupBy?: AnalyticsGroupBy;
  breakSettingId?: number | null;
}

export interface AgentOnlineStatus {
  userName: string;
  userId: string;
  breakTimeMinutes: number;
}

export interface AgentBreakStatus {
  userName: string;
  userId: string;
  breakType: string;
  breakName: string;
  breakTimeMinutes: number;
  breakDurationMinutes: number;
  breakOvertimeMinutes: number;
}

export interface AgentOfflineStatus {
  userName: string;
  userId: string;
  breakTimeMinutes: number;
}

export interface AgentStatus {
  online: AgentOnlineStatus[];
  break: AgentBreakStatus[];
  offline: AgentOfflineStatus[];
}

export type GetAgentStatusResponse = NewRequestModel<AgentStatus>;
