import { IFaq } from 'kissbot-core';
import { PaginatedModel } from '../../model/PaginatedModel';
import { apiInstance, doRequest } from '../../utils/Http';

export const FaqService = {
    getListFaq: async (): Promise<PaginatedModel<IFaq>> => {
        return await doRequest(apiInstance.get(`/faq`));
    },
};
