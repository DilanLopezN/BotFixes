import { PaginatedModel } from './../../../model/PaginatedModel';
import { User, Role } from 'kissbot-core';
import { doRequest, apiInstance } from '../../../utils/Http';
import { serialize } from '../../../utils/serializeQuery';
import { ChangeUserPasswordDto } from '../interfaces/change-password.dto';

export const WorkspaceUserService = {
    getAll: async (workspaceId: string, sortField?: string, query?: any): Promise<PaginatedModel<User>> => {
        let filters = {
            filter: JSON.stringify({
                ...query,
            }),
            sort: sortField,
        };

        const queryString =
            sortField && query
                ? serialize(filters)
                : sortField
                ? `sort=${sortField}`
                : query
                ? serialize({
                      filter: JSON.stringify({
                          ...query,
                      }),
                  })
                : '';

        return await doRequest(apiInstance.get(`workspaces/${workspaceId}/users?${queryString}`), true);
    },
    getAllUsersActive: async (workspaceId: string, sortField?: string, query?: any): Promise<PaginatedModel<User>> => {
        let filters = {
            filter: JSON.stringify({
                ...query,
            }),
            sort: sortField,
        };

        const queryString =
            sortField && query
                ? serialize(filters)
                : sortField
                ? `sort=${sortField}`
                : query
                ? serialize({
                      filter: JSON.stringify({
                          ...query,
                      }),
                  })
                : '';

        return await doRequest(apiInstance.get(`workspaces/${workspaceId}/users-active?${queryString}`), true);
    },
    create: async (workspaceId: string, user: any, cbError: (args: any) => any): Promise<any> => {
        return await doRequest(
            apiInstance.post(`workspaces/${workspaceId}/users`, {
                ...user,
            }),
            false,
            cbError
        );
    },
    update: async (workspaceId: string, userId: string, userData: any, errCb?: (args: any) => any): Promise<any> => {
        return await doRequest(
            apiInstance.put(`workspaces/${workspaceId}/users/${userId}`, { ...userData }),
            false,
            errCb
        );
    },
    updatePassword: async (
        dto: ChangeUserPasswordDto,
        userId: string,
        workspaceId: string,
        errCb?: any
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`workspaces/${workspaceId}/users/${userId}/password`, dto),
            false,
            errCb
        );
    },
    getById: async (userId: string, workspaceId: string) => {
        return await doRequest(apiInstance.get(`workspaces/${workspaceId}/users/${userId}`));
    },
    // @TODO: deve buscar sem filtrar por workspace
    getByEmail: async (workspaceId: string, email: string): Promise<Array<User>> => {
        return await doRequest(apiInstance.get(`workspaces/${workspaceId}/users?email=${email}`));
    },
    createRole: async (workspaceId: string, dto: any, userId: string, onError: (args: any) => any): Promise<Role> => {
        return await doRequest(
            apiInstance.post(`workspaces/${workspaceId}/users/${userId}/roles`, {
                ...dto,
            }),
            false,
            onError
        );
    },
    deleteRole: async (
        workspaceId: string,
        userId: string,
        roleId: string,
        onError: (args: any) => any
    ): Promise<Array<User>> => {
        return await doRequest(
            apiInstance.delete(`workspaces/${workspaceId}/users/${userId}/roles/${roleId}`),
            false,
            onError
        );
    },
    queryUsersByIdList: async (idList: string): Promise<PaginatedModel<User>> => {
        return await doRequest(apiInstance.get(`users?_id=${idList}`));
    },
    loadUsersToSave: async (workspaceId: string, formData: any, cbError: (args: any) => any): Promise<any> => {
        return await doRequest(
            apiInstance.post(`workspaces/${workspaceId}/users/user-batch`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            false,
            cbError
        );
    },
};
