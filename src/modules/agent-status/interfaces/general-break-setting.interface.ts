export interface GeneralBreakSettingData {
    workspaceId: string;
    enabled?: boolean;
    notificationIntervalSeconds?: number;
    breakStartDelaySeconds?: number;
    maxInactiveDurationSeconds?: number;
}

export interface CreateGeneralBreakSettingData {
    workspaceId: string;
    enabled?: boolean;
    notificationIntervalSeconds?: number;
    breakStartDelaySeconds?: number;
    maxInactiveDurationSeconds?: number;
}

export interface UpdateGeneralBreakSettingData {
    enabled?: boolean;
    notificationIntervalSeconds?: number;
    breakStartDelaySeconds?: number;
    maxInactiveDurationSeconds?: number;
}
