export interface GeneralBreakSettingData {
    workspaceId: string;
    enabled?: boolean;
    notificationIntervalSeconds?: number;
    breakStartDelaySeconds?: number;
    maxInactiveDurationSeconds?: number;
    excludedUserIds?: string[];
}

export interface CreateGeneralBreakSettingData {
    workspaceId: string;
    enabled?: boolean;
    notificationIntervalSeconds?: number;
    breakStartDelaySeconds?: number;
    maxInactiveDurationSeconds?: number;
    excludedUserIds?: string[];
}

export interface UpdateGeneralBreakSettingData {
    enabled?: boolean;
    notificationIntervalSeconds?: number;
    breakStartDelaySeconds?: number;
    maxInactiveDurationSeconds?: number;
    excludedUserIds?: string[];
}
