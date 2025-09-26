import { HealthEntityType, User } from 'kissbot-core';
import { HealthEntity, HealthIntegration } from '../../../../../../model/Integrations';

export interface HealthEntityListProps {
    entityType: HealthEntityType;
    workspaceId: string;
    integration: HealthIntegration;
    setSelectedIntegration: (integration: HealthIntegration) => void;
    loggedUser?: User;
}

export interface Sorter {
    field: string;
    order: 'ascend' | 'descend';
}

export interface TableHealthEntity {
    key: string;
    entityName: string;
    activeErp: boolean;
    friendlyName: string;
    scheduling: HealthEntity;
    canCancel: HealthEntity;
    canConfirmActive: HealthEntity;
    canConfirmPassive: HealthEntity;
    canView: HealthEntity;
    canReschedule: HealthEntity;
    canSchedule: HealthEntity;
    order: string;
    parentTitle: HealthEntity;
    actions: HealthEntity;
}
