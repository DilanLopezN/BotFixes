export interface UpdateSmtReSettingData {
    initialWaitTime?: number;
    initialMessage?: string;
    automaticWaitTime?: number;
    automaticMessage?: string;
    finalizationWaitTime?: number;
    finalizationMessage?: string;
    name?: string;
    teamIds?: string[];
}