import { HealthEntity } from '../../../../model/Integrations';
import { PaginatedModel } from '../../../../model/PaginatedModel';
import { doRequest, apiInstance } from '../../../../utils/Http';
import { ConfirmationData, GetConfirmationListParams, GetInterfaceEntity } from './interfaces';

export const ConfirmationListService = {
    getConfirmationList: async (
        workspaceId: string,
        params: GetConfirmationListParams,
        queryString: string,
        errCb?: any
    ): Promise<ConfirmationData> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/schedules${queryString}`, params),
            undefined,
            errCb
        );
    },
    getConfirmationEntity: async ({
        workspaceId,
        integrationId,
        queryString,
        errCb,
    }: GetInterfaceEntity): Promise<PaginatedModel<HealthEntity>> => {
        return await doRequest(
            apiInstance.get(
                `/workspaces/${workspaceId}/integrations/health/${integrationId}/health-entities${queryString}`
            ),
            undefined,
            errCb
        );
    },
};
