import { PaginatedModel } from '../../../model/PaginatedModel';
import { doRequest, apiInstance } from '../../../utils/Http';
import { ContactSearchResult } from '../interfaces/contact.interface';

interface ContactSearchQueryParams {
    limit: number;
    skip: number;
    term?: string;
    sort?: string;
}

export const ContactService = {
    getContactList: async (workspaceId: string, queryParams: any): Promise<any> => {
        const queryString = new URLSearchParams({ ...queryParams }).toString();

        return await doRequest(apiInstance.get(`workspaces/${workspaceId}/contact?${queryString}`));
    },
    getContact: async (contactId: string, workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.get(`/workspaces/${workspaceId}/contact/${contactId}`));
    },
    createContact: async (contact: any, workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.post(`/workspaces/${workspaceId}/contact`, { ...contact }));
    },
    updateContact: async (contact: any, workspaceId: string): Promise<any> => {
        return await doRequest(apiInstance.put(`/workspaces/${workspaceId}/contact/${contact._id}`, { ...contact }));
    },
    searchContactList: async (
        workspaceId: string,
        queryParams: ContactSearchQueryParams
    ): Promise<PaginatedModel<ContactSearchResult>> => {
        const queryString = new URLSearchParams({ ...queryParams } as any).toString();
        return await doRequest(apiInstance.post(`contact-search/workspaces/${workspaceId}?${queryString}`));
    },
    blockContact: async (
        workspaceId: string,
        contactId: string,
    ): Promise<any> => {
        return await doRequest(apiInstance.post(`workspaces/${workspaceId}/contact/${contactId}/block`));
    },
};
