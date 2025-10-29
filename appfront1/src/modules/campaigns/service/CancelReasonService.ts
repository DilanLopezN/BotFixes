import { doRequest, apiInstance } from '../../../utils/Http';
import { CancelReasonDto, CreateCancelReasonDto, UpdateCancelReasonDto } from '../interfaces/cancel-reason';

export const CancelReasonService = {
    getCancelReasonList: async (workspaceId: string): Promise<CancelReasonDto[]> => {
        return await doRequest(apiInstance.get(`/cancel-reason/workspaces/${workspaceId}/list`));
    },
    updateCancelReason: async (
        workspaceId: string,
        reasonId: number,
        data: UpdateCancelReasonDto,
        errCb?
    ): Promise<{ ok: boolean }> => {
        return await doRequest(
            apiInstance.put(`/cancel-reason/workspaces/${workspaceId}/reasonId/${reasonId}`, data),
            undefined,
            errCb
        );
    },
    createCancelReason: async (
        workspaceId: string,
        data: CreateCancelReasonDto,
        errCb?
    ): Promise<CancelReasonDto> => {
        return await doRequest(
            apiInstance.post(`/cancel-reason/workspaces/${workspaceId}/create`, data),
            undefined,
            errCb
        );
    },
};
