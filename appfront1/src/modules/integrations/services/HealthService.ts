import { HealthEntityType, HealthFlow } from 'kissbot-core';
import { HealthEntity, HealthIntegration } from '../../../model/Integrations';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { apiInstance, doRequest } from '../../../utils/Http';
import { serialize } from '../../../utils/serializeQuery';
import { FiltersPagination } from '../pages/health/components/Flow';
import { HealthEntityParams } from './interfaces';

export const HealthService = {
    getHealthIntegrations: (workspaceId: string): Promise<PaginatedModel<HealthIntegration>> => {
        return doRequest(apiInstance.get(`/workspaces/${workspaceId}/integrations/health`));
    },

    getIntegrationNotifications: (workspaceId: string, integrationId: string): Promise<any> => {
        return doRequest(apiInstance.get(`/workspaces/${workspaceId}/integrations/${integrationId}/messages/`));
    },

    createIntegrationNotification(
        workspaceId: string,
        integrationId: string,
        message: string,
        cb?: (data?: any) => any
    ): Promise<any> {
        return doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/integrations/${integrationId}/messages/`, { message }),
            false,
            cb
        );
    },

    deleteIntegrationNotification(
        workspaceId: string,
        integrationId: string,
        messageId: string,
        cb?: (data?: any) => any
    ): Promise<any> {
        return doRequest(
            apiInstance.delete(`/workspaces/${workspaceId}/integrations/${integrationId}/messages/${messageId}`),
            false,
            cb
        );
    },

    getIntegrationStatus: (workspaceId: string, integrationId: string): Promise<any> => {
        return doRequest(apiInstance.get(`/workspaces/${workspaceId}/integrations/${integrationId}/status`));
    },
    getHealthEntities: ({
        workspaceId,
        integrationId,
        entityType,
        search,
        skip,
        sort,
        cb,
        limit,
        hideInactive,
    }: HealthEntityParams): Promise<PaginatedModel<HealthEntity>> => {
        const filters: { [key: string]: string } = {
            sort: !!sort ? sort : 'parent.name',
            limit: String(limit ?? 12),
            skip: String(skip),
            entityType,
        };

        if (!!search) {
            filters.search = search;
        }

        if (hideInactive) {
            filters.activeErp = 'true';
        }

        const query = serialize(filters);

        return doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities?${query}`),
            false,
            cb
        );
    },
    getHealthAllEntities: (
        workspaceId: string,
        integrationId: string,
        entityType: string,
        projection?: { [key: string]: number },
        cb?: (data?: any) => any
    ): Promise<PaginatedModel<HealthEntity>> => {
        let filters: { [key: string]: any } = {
            entityType: entityType,
            filter: {},
        };
        if (projection) {
            filters.projection = JSON.stringify(projection);
        }
        filters.filter = JSON.stringify(filters.filter);
        const query = serialize(filters);
        return doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities?${query}`),
            false,
            cb
        );
    },
    getHealthEntitiesByIds: (
        workspaceId: string,
        integrationId: string,
        ids: string[],
        cb?: (data?: any) => any
    ): Promise<PaginatedModel<HealthEntity>> => {
        const reducedIds = ids.reduce((total, curr, index) => {
            return `${total}${curr}${index < ids.length - 1 ? ',' : ''}`;
        }, '');

        return doRequest(
            apiInstance.get(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities?_id=${reducedIds}`
            ),
            false,
            cb
        );
    },
    updateHealthEntity: (
        workspaceId: string,
        integrationId: string,
        entity: HealthEntity,
        cb?: (data?: any) => any
    ): Promise<any> => {
        return doRequest(
            apiInstance.put(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities/${entity._id}`,
                entity
            ),
            false,
            cb
        );
    },
    updateHealthEntityBatch: (
        workspaceId: string,
        integrationId: string,
        entityList: HealthEntity[],
        cb?: (data?: any) => any
    ): Promise<any> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities/update/batch`,
                entityList
            ),
            false,
            cb
        );
    },
    deleteHealthEntityBatch: (
        workspaceId: string,
        integrationId: string,
        entityList: string[],
        cb?: (data?: any) => any
    ): Promise<any> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities/delete/batch`,
                entityList
            ),
            false,
            cb
        );
    },
    updateReverseChangesHealthEntity: (
        workspaceId: string,
        integrationId: string,
        entity: HealthEntity,
        cb?: (data?: any) => any
    ): Promise<any> => {
        return doRequest(
            apiInstance.put(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities/${entity._id}/draft`,
                entity
            ),
            false,
            cb
        );
    },
    deleteHealthEntity: (
        workspaceId: string,
        integrationId: string,
        entityId: string,
        cb?: (data?: any) => any
    ): Promise<any> => {
        return doRequest(
            apiInstance.delete(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities/${entityId}`
            ),
            false,
            cb
        );
    },
    getHealthFlows: (
        workspaceId: string,
        integrationId: string,
        filter?: FiltersPagination,
        cb?: (data?: any) => any
    ): Promise<PaginatedModel<HealthFlow>> => {
        let filters: { [key: string]: any } = {
            limit: String(filter?.limit || 10),
            skip: String(filter?.skip || 0),
            sort: filter?.sort || '-createdAt',
        };
        if (filter?.search) {
            filters.filter = filter.search;
        }
        const query = serialize(filters);

        return doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/integrations/health/${integrationId}/health-flows?${query}`),
            false,
            cb
        );
    },
    createHealthFlow: (
        workspaceId: string,
        integrationId: string,
        flow: HealthFlow,
        cb?: (data?: any) => any
    ): Promise<any | HealthFlow> => {
        return doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/integrations/health/${integrationId}/health-flows`, flow),
            false,
            cb
        );
    },
    deleteHealthFlow: (
        workspaceId: string,
        integrationId: string,
        flowId: string,
        cb?: (data?: any) => any
    ): Promise<any> => {
        return doRequest(
            apiInstance.delete(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-flows/${flowId}`
            ),
            false,
            cb
        );
    },
    updateHealthFlow: (
        workspaceId: string,
        integrationId: string,
        flow: HealthFlow,
        cb?: (data?: any) => any
    ): Promise<HealthFlow> => {
        return doRequest(
            apiInstance.put(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-flows/${flow._id}`,
                flow
            ),
            false,
            cb
        );
    },
    syncHealthFlows: (workspaceId: string, integrationId: string, cb?: (data?: any) => any): Promise<HealthFlow> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-flows/sync`,
                undefined
            ),
            false,
            cb
        );
    },
    syncForceHealthFlows: (
        workspaceId: string,
        integrationId: string,
        cb?: (data?: any) => any
    ): Promise<HealthFlow> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-flows/sync-force`,
                undefined
            ),
            false,
            cb
        );
    },
    syncHealthDraftFlows: (
        workspaceId: string,
        integrationId: string,
        cb?: (data?: any) => any
    ): Promise<HealthFlow> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-flows/sync-draft`,
                undefined
            ),
            false,
            cb
        );
    },
    updateHealthIntegration: (
        workspaceId: string,
        integration: HealthIntegration,
        cb?: (data?: any) => any
    ): Promise<any> => {
        return doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/integrations/health/${integration._id}`, integration),
            false,
            cb
        );
    },
    createHealthIntegration: (
        workspaceId: string,
        integration: HealthIntegration,
        cb?: (data?: any) => any
    ): Promise<HealthIntegration> => {
        return doRequest(apiInstance.post(`/workspaces/${workspaceId}/integrations/health`, integration), false, cb);
    },
    createHealthEntity: (
        workspaceId: string,
        integrationId: string,
        entity: HealthEntity[],
        cb?: (data?: any) => any
    ): Promise<any | HealthEntity[]> => {
        return doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities`, entity),
            false,
            cb
        );
    },
    synchronizeHealthIntegration: (
        workspaceId: string,
        integration: HealthIntegration,
        force?: boolean,
        cb?: (data?: any) => any
    ): Promise<HealthIntegration> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integration._id}/synchronize${
                    !!force ? `?force=${force}` : ''
                }`,
                {}
            ),
            false,
            cb
        );
    },
    extractAllHealthEntities: (
        workspaceId: string,
        integration: HealthIntegration,
        cb?: (data?: any) => any
    ): Promise<HealthIntegration> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integration._id}/entities/extract`,
                {},
                {
                    timeout: 300_000,
                }
            ),
            false,
            cb
        );
    },
    synchronizeHealthEntities: (
        workspaceId: string,
        integration: HealthIntegration,
        cb?: (data?: any) => any
    ): Promise<HealthIntegration> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integration._id}/entities/synchronize`,
                {},
                { timeout: 300_000 }
            ),
            false,
            cb
        );
    },
    synchronizeHealthEntitieByEntityType: (
        workspaceId: string,
        integration: HealthIntegration,
        entityType: HealthEntityType,
        cb?: (data?: any) => any
    ): Promise<HealthIntegration> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integration._id}/entities/synchronize/${entityType}`,
                {},
                { timeout: 30_000 }
            ),
            false,
            cb
        );
    },
    extractHealthEntities: (
        workspaceId: string,
        entityType: HealthEntityType,
        integration: HealthIntegration,
        cb?: (data?: any) => any
    ): Promise<HealthIntegration> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integration._id}/extract/${entityType}`,
                {}
            ),
            false,
            cb
        );
    },
    getAllHealthEntities: (
        workspaceId: string,
        integrationId: string,
        cb?: (data?: any) => any
    ): Promise<PaginatedModel<HealthEntity>> => {
        return doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities`),
            false,
            cb
        );
    },
    getAllHealthEntitiesByEntityType: (
        workspaceId: string,
        integrationId: string,
        entityType: HealthEntityType,
        cb?: (data?: any) => any
    ): Promise<PaginatedModel<HealthEntity>> => {
        let filter: any = {
            filter: {},
        };
        filter.filter.entityType = entityType;
        filter.filter.$or = [
            {
                activeErp: true,
            },
            {
                source: 1,
            },
        ];

        filter.filter = JSON.stringify(filter.filter);

        const query = serialize(filter);

        return doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities?${query}`),
            false,
            cb
        );
    },
    clearCacheIntegration: (
        workspaceId: string,
        integrationId: string,
        cb?: (data?: any) => any
    ): Promise<HealthIntegration> => {
        return doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/integrations/health/${integrationId}/clear-cache`, {}),
            false,
            cb
        );
    },
    generateAccessToken: (
        workspaceId: string,
        integrationId: string,
        cb?: (data?: any) => any
    ): Promise<{ token: string }> => {
        return doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/integrations/health/${integrationId}/generateAccessToken`, {}),
            false,
            cb
        );
    },
    getPendingPublicationsFlows: (
        workspaceId: string,
        integrationId: string,
        cb?: (data?: any) => any
    ): Promise<{
        pendingFlows: { data: HealthFlow[]; count: number };
        pendingFlowsDraft: { data: HealthFlow[]; count: number };
    }> => {
        return doRequest(
            apiInstance.get(
                `/workspaces/${workspaceId}/integrations/general/${integrationId}/pending-publication-flow`
            ),
            false,
            cb
        );
    },
    deleteDisabledEntities: (
        workspaceId: string,
        integrationId: string,
        entityType: string,
        cb?: (data?: any) => any
    ): Promise<{
        ok: boolean;
    }> => {
        return doRequest(
            apiInstance.post(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities/delete-disabled/${entityType}`,
                {}
            ),
            false,
            cb
        );
    },
};
