export interface RemiConfigData {
    initialWaitTime?: number;
    initialMessage?: string;
    automaticWaitTime?: number;
    automaticMessage?: string;
    finalizationWaitTime?: number;
    finalizationMessage?: string;
    name?: string;
    teamIds?: string[];
    id?: string;
    active?: boolean;
    objectiveId?: string | null;
    outcomeId?: string | null;
    automaticReactivate?: boolean;
}
export interface SmartReengagementSettingsResponse {
    data: RemiConfigData[];
}
