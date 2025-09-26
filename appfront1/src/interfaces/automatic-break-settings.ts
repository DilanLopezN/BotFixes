export interface AutomaticBreakSettings {
  workspaceId: string;
  enabled: boolean;
  notificationIntervalSeconds: number;
  breakStartDelaySeconds: number;
  maxInactiveDurationSeconds: number;
}
