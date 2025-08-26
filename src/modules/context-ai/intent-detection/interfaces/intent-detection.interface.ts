import { IIntentActions } from './intent-actions.interface';

export interface IIntentDetection {
    id: string;
    name: string;
    description: string;
    examples: string[];
    agentId: string;
    workspaceId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    actions?: IIntentActions[];
}

export interface CreateIntentDetectionData {
    name: string;
    description: string;
    examples: string[];
    agentId: string;
    workspaceId: string;
}

export interface UpdateIntentDetectionData {
    intentDetectionId: string;
    name?: string;
    description?: string;
    examples?: string[];
    agentId?: string;
    workspaceId?: string;
}

export interface DeleteIntentDetectionData {
    intentDetectionId: string;
}

export interface ListIntentDetectionFilter {
    agentId?: string;
    workspaceId?: string;
}
