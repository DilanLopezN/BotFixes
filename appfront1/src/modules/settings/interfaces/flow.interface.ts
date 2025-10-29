export interface Flow {
    id: number;
    workspaceId: string;
    channelConfigId: string;
    flowId: string;
    flowName: string;
    status: string;
    flowLibraryId: number;
    flowFields?: Record<string, any>;
}
