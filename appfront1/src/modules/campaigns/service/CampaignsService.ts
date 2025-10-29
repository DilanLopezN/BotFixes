import { PaginatedModel } from '../../../model/PaginatedModel';
import { doRequest, apiInstance } from '../../../utils/Http';
import { serialize } from '../../../utils/serializeQuery';
import { ActiveMessageStatusData, CreateActiveMessageSettingDto, ObjectiveType, UpdateActiveMessageSettingDto } from '../interfaces/active-message-setting-dto';
import { Campaign, CampaignAction, CampaignAttribute, Contact, ContactAttribute, CreateCampaignAttributeData, CreateCampaignData, UpdateCampaignData } from '../interfaces/campaign';

export const CampaignsService = {
    getActiveMessages: async (workspaceId: string, filter?: {objective: ObjectiveType}): Promise<any> => {
        const filters: { [key: string]: any } = {
            objective: filter?.objective,
        };
        
        const query = serialize(filters);
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/active-message-settings${filter?.objective ? `?${query}` : ''}`));
    },
    getOneActiveMessage: async (workspaceId: string, id: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/active-message-settings/${id}`));
    },
    updateActiveMessage: async (
        workspaceId: string,
        activeMessage: UpdateActiveMessageSettingDto,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/active-message-settings`, activeMessage),
            undefined,
            errCb
        );
    },
    createActiveMessage: async (
        workspaceId: string,
        activeMessage: CreateActiveMessageSettingDto,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/active-message-settings`, activeMessage),
            undefined,
            errCb
        );
    },
    deleteActiveMessage: async (workspaceId: string, id: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/active-message-settings/${id}`), errCb);
    },
    getStatusActiveMessages: async (workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/active-message-status`));
    },
    createActiveMessageStatus: async (
        workspaceId: string,
        activeMessageStatus: ActiveMessageStatusData,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/active-message-status`, activeMessageStatus),
            undefined,
            errCb
        );
    },
    updateActiveMessageStatus: async (
        workspaceId: string,
        statusId: string,
        activeMessageStatus: ActiveMessageStatusData,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/active-message-status/${statusId}`, activeMessageStatus),
            undefined,
            errCb
        );
    },
    deleteActiveMessageStatus: async (workspaceId: string, id: string, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/active-message-status/${id}`), errCb);
    },



    createCampaign: async (
        workspaceId: string,
        campaign: CreateCampaignData,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign`, campaign),
            undefined,
            errCb
        );
    },
    updateCampaign: async (
        workspaceId: string,
        campaignId: number,
        campaign: UpdateCampaignData,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/campaign/${campaignId}`, campaign),
            undefined,
            errCb
        );
    },
    getCampaignByWorkspace: async (
        workspaceId: string,
        filter?: {
            skip: number,
            limit: number,
            isTest?: boolean,
        },
        errCb?
    ): Promise<PaginatedModel<Campaign>> => {
        const filters: { [key: string]: any } = {
            limit: String(filter?.limit || 4),
            skip: String(filter?.skip || 0),
            isTest: filter?.isTest,
        };
        
        const query = serialize(filters);
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/campaign?${query}`),
            true,
            errCb
        );
    },
    getCampaignById: async (
        workspaceId: string,
        campaignId: number,
        errCb?
    ): Promise<Campaign> => {
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/campaign/${campaignId}`),
            undefined,
            errCb
        );
    },
    cloneCampaign: async (
        workspaceId: string,
        campaign: CreateCampaignData,
        campaignId: number,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign/${campaignId}/clone`, campaign),
            undefined,
            errCb
        );
    },
    deleteCampaign: async (workspaceId: string, campaignId: number, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/campaign/${campaignId}`), true, errCb);
    },
    getAttributesByCampaign: async (
        workspaceId: string,
        campaignId: number,
        errCb?
    ): Promise<CampaignAttribute[]> => {
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/campaign/${campaignId}/attribute`),
            undefined,
            errCb
        );
    },
    createCampaignAttribute: async (
        workspaceId: string,
        campaignId: number,
        campaignAttribute: CreateCampaignAttributeData,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign/${campaignId}/attribute`, campaignAttribute),
            undefined,
            errCb
        );
    },
    updateCampaignAttribute: async (
        workspaceId: string,
        campaignId: number,
        attributeId: number,
        campaignAttribute: CampaignAttribute,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/campaign/${campaignId}/attribute/${attributeId}`, campaignAttribute),
            undefined,
            errCb
        );
    },
    deleteCampaignAttribute: async (workspaceId: string, campaignId: number, id: number, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/campaign/${campaignId}/attribute/${id}`), errCb);
    },
    createCampaignContactBatch: async (
        workspaceId: string,
        campaignId: number,
        formData: any,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign/${campaignId}/contact-batch`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            undefined,
            errCb
        );
    },
    startCampaign: async (
        workspaceId: string,
        campaignId: number,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign/${campaignId}/start`),
            true,
            errCb
        );
    },
    pauseCampaign: async (
        workspaceId: string,
        campaignId: number,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign/${campaignId}/pause`),
            true,
            errCb
        );
    },
    getContactsByCampaign: async (
        workspaceId: string,
        campaignId: number,
        filter?: {
            skip: number,
            limit: number,
        },
        errCb?
    ): Promise<PaginatedModel<any[]>> => {
        const filters: { [key: string]: any } = {
            limit: String(filter?.limit || 10),
            skip: String(filter?.skip || 0),
        };
        
        const query = serialize(filters);
        return await doRequest(
            apiInstance.get(`/workspaces/${workspaceId}/campaign/${campaignId}/contact?${query}`),
            undefined,
            errCb
        );
    },
    updateContactName: async (
        workspaceId: string,
        campaignId: number,
        contactId: number,
        contact: Contact,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/campaign/${campaignId}/contact_name/${contactId}`, contact),
            undefined,
            errCb
        );
    },
    updateContactAttribute: async (
        workspaceId: string,
        campaignId: number,
        contactAttributeId: number,
        contactAttribute: ContactAttribute,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.put(`/workspaces/${workspaceId}/campaign/${campaignId}/contact/${contactAttribute.contactId}/contact_attribute/${contactAttributeId}`, contactAttribute),
            undefined,
            errCb
        );
    },
    createContactAttribute: async (
        workspaceId: string,
        campaignId: number,
        contactAttribute: ContactAttribute,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign/${campaignId}/contact/${contactAttribute.contactId}/contact_attribute`, contactAttribute),
            undefined,
            errCb
        );
    },
    deleteContact: async (workspaceId: string, campaignId: number, id: number, errCb?): Promise<any> => {
        return await doRequest(apiInstance.delete(`/workspaces/${workspaceId}/campaign/${campaignId}/contact/${id}`), errCb);
    },
    deleteContactBatch: async (
        workspaceId: string,
        campaignId: number,
        contactIds: number[],
        deleteAll?: boolean,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign/${campaignId}/contact/delete-batch`, {
                contactIds: contactIds,
                deleteAll: deleteAll,
            }),
            undefined,
            errCb
        );
    },
    getCampaignActions: async (workspaceId: string): Promise<CampaignAction[]> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/campaign-actions`));
    },
    updateCampaignIsTest: async (
        workspaceId: string,
        campaignId: number,
        isTest: boolean,
        errCb?
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/campaign/${campaignId}/update-isTest`, {isTest: isTest}),
            true,
            errCb
        );
    },
};
