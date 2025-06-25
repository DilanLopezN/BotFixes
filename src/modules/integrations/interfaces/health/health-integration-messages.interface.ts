export interface HealthIntegrationMessages {
    integrationId: string;
    workspaceId: string;
    createdAt: number;
    createdByUserId?: string;
    message: string;
    type: IntegrationMessageType;
}

export interface CreateIntegrationMessage {
    integrationId: string;
    workspaceId: string;
    createdAt: number;
    createdByUserId?: string;
    message: string;
    type: IntegrationMessageType;
}

export enum IntegrationMessageType {
    system = 'system',
    user = 'user',
}
