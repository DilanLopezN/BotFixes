import { Entity } from "kissbot-core";
import { ApiErrorCallback } from "../../../interfaces/api-error.interface";
import { Interaction } from "../../../model/Interaction";
import { PaginatedModel } from "../../../model/PaginatedModel";
import { apiInstance, doRequest } from "../../../utils/Http";

export const EntityService = {
    getEntityList: async (workspaceId: string): Promise<PaginatedModel<Entity>> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/entities/`), true)
    },
    getEntityById: async (workspaceId: string, entityId: string): Promise<Array<Entity>> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/entities/` + entityId))
    },
    deleteEntity: async (workspaceId: string, entityId: string, onError: ApiErrorCallback): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/entities/` + entityId,), false, onError);
    },
    createEntity: async (entity: Entity, workspaceId: string, onError: (e) => any): Promise<Entity> => {
        return await doRequest(apiInstance.post(`/workspaces/${workspaceId}/entities/`, entity), false, onError)
    },
    updateEntity: async (entity: Entity, workspaceId: string, entityId: string, onError: (e) => any): Promise<Interaction> => {
        return await doRequest(apiInstance.put(`/workspaces/${workspaceId}/entities/` + entityId, entity), false, onError);
    },
};
