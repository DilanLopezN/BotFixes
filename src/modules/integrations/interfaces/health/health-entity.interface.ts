import { HealthEntityType } from '../../schemas/health/health-entity.schema';
import { Document, Types } from 'mongoose';
import { HealthEntitySource } from 'kissbot-core';

export interface IHealthEntity {
    code: string;
    name: string;
    friendlyName: string;
    synonyms: string[];
    version: string;
    lastUpdate: number;
    specialityType: string;
    specialityCode: string;
    insurancePlanCode: string;
    insuranceCode: string;
    parent?: IHealthEntity | null;
    workspaceId: Types.ObjectId;
    integrationId: Types.ObjectId;
    entityType: HealthEntityType;
    source: HealthEntitySource;
    order: number;
    data?: any;
    activeErp?: boolean;
    createdAt?: number;
    deletedAt?: number;
    updatedAt?: number;
    createdBy?: string;
    updatedBy?: string;
    draft?: Partial<IHealthEntity>;
    references?: IEntityReference[];
    guidance?: string;
    canSchedule: boolean;
    canReschedule: boolean;
    canCancel: boolean;
    canConfirmActive: boolean;
    canConfirmPassive: boolean;
    canView: boolean;
}

export type HealthEntity = IHealthEntity & Document;

export interface ExternalHealthEntity {
    _id?: string;
    code: string;
    name: string;
    synonyms: string[];
    entityType: HealthEntityType;
    version: string;
    lastUpdate: number;
    specialityType: string;
    specialityCode: string;
    insuranceCode: string;
    insurancePlanCode: string;
    activeErp?: boolean;
    params?: any;
    canSchedule?: boolean;
    canReschedule?: boolean;
    canConfirmActive?: boolean;
    canConfirmPassive?: boolean;
    canCancel: boolean;
    canView?: boolean;
}

export interface IEntityReference {
    refId: string;
    type: HealthEntityType;
}
