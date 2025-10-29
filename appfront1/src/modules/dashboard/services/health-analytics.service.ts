import axios, { AxiosRequestConfig, CancelTokenSource } from 'axios';
import { doRequest, apiInstance } from '../../../utils/Http';
import { AppointmentFilterInterface } from '../components/AppointmentFilter/props';

export const HealthAnalyticsService = {
    getAllData: async (
        workspaceId: string,
        filter: AppointmentFilterInterface,
        cancelToken?: CancelTokenSource,
        errCb?: (error: any) => any,
        pendingCb?: (isPending: boolean) => any
    ): Promise<any> => {
        if (pendingCb) {
            pendingCb(false);
        }
        const isCanceled = cancelToken?.token.reason instanceof axios.Cancel;

        if (pendingCb && !isCanceled) {
            pendingCb(true);
        }
        const requestConfig: AxiosRequestConfig = {
            cancelToken: cancelToken?.token,
        };
        const requestPromise = await doRequest(
            apiInstance.post(`/HA/workspaces/${workspaceId}/health-analytics`, filter, requestConfig),
            false,
            errCb
        );
        if (pendingCb) {
            pendingCb(axios.isCancel(requestPromise));
        }

        return requestPromise;
    },
};
