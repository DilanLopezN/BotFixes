export interface CreateSmtReSettingData {
    workspaceId: string;
    initialWaitTime: number;
    initialMessage: string;
    automaticWaitTime: number;
    automaticMessage: string;
    finalizationWaitTime: number;
    finalizationMessage: string;
    name: string;
    teamIds?: string[];
}