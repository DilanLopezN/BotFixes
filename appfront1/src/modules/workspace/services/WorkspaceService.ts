import { Bot } from '../../../model/Bot';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { AdvancedModuleFeatures, CustomerXSettings, Workspace } from '../../../model/Workspace';
import { apiInstance, doRequest } from '../../../utils/Http';
import { serialize } from '../../../utils/serializeQuery';
import { Tag } from '../../liveAgent/components/TagSelector/props';
import { TemplateMessage } from './../../liveAgent/components/TemplateMessageList/interface';

export const WorkspaceService = {
    getWorkspaceList: async (query?: any): Promise<PaginatedModel<Workspace>> => {
        let toSerialize = {
            filter: JSON.stringify(query?.filter || { simple: true }),
            sort: 'name',
        } as any;

        if (query) {
            toSerialize = {
                ...toSerialize,
            };

            if (query.projection) {
                toSerialize.projection = JSON.stringify({ ...query.projection });
            }

            if (query.skip) toSerialize.skip = query.skip;

            if (query.limit) toSerialize.limit = query.limit;

            if (!!query.search) {
                toSerialize = {
                    ...toSerialize,
                    search: query.search,
                };
            }
        }
        const queryString = serialize({
            ...toSerialize,
        });
        return await doRequest(apiInstance.get(`/workspaces?${queryString}`), true);
    },
    getWorkspace: async (id: string): Promise<Workspace> => {
        return await doRequest(apiInstance.get('/workspaces/' + id), true);
    },
    syncWorkspace: async (id: string): Promise<Workspace> => {
        return await doRequest(apiInstance.get(`/workspaces/${id}/sync`));
    },
    createWorkspace: async (workspace: any): Promise<Workspace> => {
        return await doRequest(apiInstance.post('/workspaces', workspace));
    },
    getWorkspaceBots: async (id: string): Promise<PaginatedModel<Bot>> => {
        return await doRequest(apiInstance.get('/workspaces/' + id + '/bots'));
    },
    createBot: async (bot: Bot, workspaceId: string): Promise<Bot> => {
        return await doRequest(apiInstance.post('/workspaces/' + workspaceId + '/bots', bot));
    },
    updateWorkspace: async (
        id: string,
        workspace: Workspace,
        errCb: (args: any) => any,
        analyticsRanges?: Record<string, any>
    ): Promise<Workspace> => {
        const payload = {
            ...workspace,
            ...(analyticsRanges && { analyticsRanges }),
        };

        return await doRequest(apiInstance.put('/workspaces/' + id, payload), false, errCb);
    },

    updateWorkspaceName: async (id: string, data: { name: string }, errCb: (args: any) => any): Promise<Workspace> => {
        return await doRequest(apiInstance.put(`/workspaces/${id}/update-name`, data), false, errCb);
    },
    updateWorkspaceCustomerSettings: async (
        id: string,
        customerSettings: CustomerXSettings,
        errCb: (args: any) => any
    ): Promise<Workspace> => {
        return await doRequest(apiInstance.put(`/workspaces/${id}/update-customer`, customerSettings), false, errCb);
    },
    getTemplates: async (
        query: any,
        workspaceId: string,
        errCb?: (args: any) => any
    ): Promise<PaginatedModel<TemplateMessage>> => {
        const filter = {
            filter: {},
        };

        let toSerialize = {
            filter: filter.filter,
            sort: '-createdAt',
        } as any;

        if (query) {
            toSerialize = {
                ...toSerialize,
                skip: query.skip || 0,
            };

            if (query.limit) toSerialize.limit = query.limit;

            if (query.search) toSerialize.search = query.search;

            if (query.filter)
                filter.filter = {
                    ...filter.filter,
                    ...query.filter,
                };
        }

        toSerialize.filter = JSON.stringify(filter.filter || {});

        const queryString = serialize({
            ...toSerialize,
            ...query.custom,
        });

        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/template-message?${queryString}`),
            true,
            errCb
        );
    },
    getTemplate: async (workspaceId: string, templateId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/templates/${templateId}`));
    },
    createTemplate: async (
        formData: FormData,
        workspaceId: string,
        isHsm: boolean,
        allowTemplateCategoryChange: boolean,
        errCb?: (args: any) => any
    ): Promise<TemplateMessage> => {
        const query = { allowTemplateCategoryChange: allowTemplateCategoryChange };

        const queryString = serialize({
            ...query,
        });
        return await doRequest(
            apiInstance.post(
                '/workspaces/' + workspaceId + `/template-message${isHsm ? `?${queryString}` : ''}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        timeout: 30_000,
                    },
                }
            ),
            false,
            errCb
        );
    },
    deleteTemplate: async (
        templateId: string,
        workspaceId: string,
        errCb?: (args: any) => any
    ): Promise<TemplateMessage> => {
        return await doRequest(
            apiInstance.delete('/workspaces/' + workspaceId + '/template-message/' + templateId),
            false,
            errCb
        );
    },
    updateTemplate: async (
        formData: FormData,
        templateId: string,
        workspaceId: string,
        errCb: (args: any) => any
    ): Promise<TemplateMessage> => {
        return await doRequest(
            apiInstance.put('/workspaces/' + workspaceId + '/template-message/' + templateId, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    timeout: 30_000,
                },
            }),
            false,
            errCb
        );
    },
    workspaceTags: async (workspaceId: string, query?: any): Promise<PaginatedModel<Tag>> => {
        const filter = {
            filter: {},
        };

        let toSerialize = {
            filter: filter.filter,
            sort: '+inactive',
        } as any;

        if (query) {
            toSerialize = {
                ...toSerialize,
                skip: query.skip || 0,
            };

            if (query.limit) toSerialize.limit = query.limit;

            if (query.search) toSerialize.search = query.search;

            if (query.filter)
                filter.filter = {
                    ...filter.filter,
                    ...query.filter,
                };
        }

        toSerialize.filter = JSON.stringify(filter.filter || {});

        const queryString = serialize({
            ...toSerialize,
        });
        const compareInactive = (a: Tag, b: Tag) => {
            if (a.inactive === b.inactive) {
                return 0;
            }
            if (a.inactive) {
                return 1;
            }
            return -1;
        };
        const response = await doRequest(apiInstance.get(`/workspaces/${workspaceId}/tags?${queryString}`), true);
        if (response && response.data) {
            response.data.sort(compareInactive);
        }
        return response;
    },
    getTagWorkspace: async (workspaceId: string, tagId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/tags/${tagId}`));
    },
    createTagWorkspace: async (workspaceId: string, tag: Tag, cbError): Promise<any> => {
        return await doRequest(apiInstance.post(`/workspaces/${workspaceId}/tags`, { ...tag }), cbError);
    },
    updateTagWorkspace: async (workspaceId: string, tag: Tag, cbError?): Promise<any> => {
        return await doRequest(apiInstance.put(`/workspaces/${workspaceId}/tags/${tag._id}`, { ...tag }), cbError);
    },
    deleteTagWorkspace: async (workspaceId: string, tagId: string, cbError?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/tags/${tagId}`), cbError);
    },
    checkWorkspaceBlocked: async (workspaceId: string): Promise<boolean> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/check-blocked`), false);
    },
    updateFlagsAndConfigs: async (
        workspaceId: string,
        payload: { featureFlag?: Record<string, any>; generalConfigs?: Record<string, any> },
        errCb?: (error: any) => void
    ): Promise<Workspace> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/customization`, payload),
            undefined,
            errCb
        );
    },
    updateAdvancedModule: async (
        workspaceId: string,
        payload: AdvancedModuleFeatures,
        errCb?
    ): Promise<TemplateMessage> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/updateAdvancedModuleFeatures`, {
                advancedModuleFeatures: payload,
            }),
            undefined,
            errCb
        );
    },
};
