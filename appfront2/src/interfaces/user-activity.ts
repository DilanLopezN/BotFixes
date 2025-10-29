import type { UserActivityStatus } from '~/constants/user-activity-status';
import type { AutomaticBreakSettings } from './automatic-break-settings';

export interface UserActivity {
  id: number;
  workspaceId: string;
  userId: string;
  teamIds?: string[];
  type: UserActivityStatus;
  startedAt: number;
  endedAt?: number;
  durationInSeconds?: number;
  breakOvertimeSeconds?: number;
  justification?: string;
  breakChangedByUserId?: string;
  breakChangedByUserName?: string;
  contextDurationSeconds?: number;
  contextMaxInactiveDurationSeconds?: number;
  breakSettingId?: number;
  contextLastAcess?: {
    generalBreakSetting: AutomaticBreakSettings;
    lastAcess: number | null;
  };
}
