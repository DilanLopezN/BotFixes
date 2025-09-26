export interface HealthEntityParams {
    workspaceId: string;
    integrationId: string;
    entityType: string;
    search?: string;
    skip: number;
    sort?: string;
    limit?: number;
    hideInactive?: boolean;
    cb?: (data?: any) => any;
}
