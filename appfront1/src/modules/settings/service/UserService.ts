import { User } from 'kissbot-core';
import { doRequest, apiInstance } from '../../../utils/Http';
import { ChangePasswordDto } from '../interfaces/change-password.dto';

export const UserService = {
    update: async (userId: string, userData: Partial<User>, workspaceId: string, errCb?: any): Promise<any> => {
        const requestData = {
            ...userData,
            workspaceId,
        };
        return await doRequest(apiInstance.put(`/users/${userId}`, requestData), false, errCb);
    },
    updatePassword: async (dto: ChangePasswordDto, errCb?: any): Promise<any> => {
        return await doRequest(apiInstance.put(`/users/password`, dto), false, errCb);
    },
    updateAvatar: async (userId: string, formData: any, errCb?: any): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/users/${userId}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            false,
            errCb
        );
    },
    authenticated: async (userId: string, workspaceId?: string, errCb?: any): Promise<any> => {
        return await doRequest(
            apiInstance.get(`/users/${userId}${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
            false,
            errCb
        );
    },
    authenticatedByToken: async (errCb?: any): Promise<User> => {
        return await doRequest(apiInstance.get(`/users/me`), false, errCb);
    },
    findByEmail: async (email: string, errCb?: any): Promise<any> => {
        return await doRequest(apiInstance.get(`/users?email=${email}`), false, errCb);
    },
    removeAvatar: async (userId: string, errCb?: any): Promise<any> => {
        return await doRequest(apiInstance.put(`users/${userId}/remove-avatar`), false, errCb);
    },
};
