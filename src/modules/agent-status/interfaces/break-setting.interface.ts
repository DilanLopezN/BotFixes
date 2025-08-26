export interface BreakSettingData {
    name: string;
    durationSeconds: number;
    workspaceId: string;
    enabled: boolean;
}

export interface CreateBreakSettingData {
    name: string;
    durationSeconds: number;
    workspaceId: string;
    enabled: boolean;
}

export interface UpdateBreakSettingData {
    name?: string;
    durationSeconds?: number;
}

export interface BreakSettingFilter {
    workspaceId: string;
    name?: string;
    enabled?: boolean;
}

export interface EnableDisableBreakSettingBulkData {
    ids: number[];
    enabled: boolean;
    workspaceId: string;
}
