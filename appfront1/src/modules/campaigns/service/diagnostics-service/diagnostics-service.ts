import { ApiErrorCallback } from '../../../../interfaces/api-error.interface';
import { apiInstance, doRequest } from '../../../../utils/Http';
import { ConsultFlowDto, ListDiagnosticExtractionsDto, ListExtractDataDto, RunManualExtractionDto } from './interfaces';

export const DiagnosticsService = {
    listDiagnosticExtractions: async (
        workspaceId: string,
        body: ListDiagnosticExtractionsDto,
        errCb?: ApiErrorCallback
    ): Promise<any[]> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/diagnostics/listDiagnosticExtractions`, body)
            ,
            false,
            errCb
        );
    },

    runManualExtraction: async (
        workspaceId: string,
        body: RunManualExtractionDto,
        errCb?: ApiErrorCallback
    ): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/diagnostics/runManualExtraction`, body),
            false,
            errCb
        );
    },

    listExtractData: async (workspaceId: string, body: ListExtractDataDto, errCb?: ApiErrorCallback): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/diagnostics/listExtractData`, body),
            false,
            errCb
        );
    },

    consultFlowData: async (workspaceId: string, body: ConsultFlowDto, errCb?: ApiErrorCallback): Promise<any> => {
        return await doRequest(
            apiInstance.post(`/workspaces/${workspaceId}/diagnostics/listMatchFlows`, body),
            false,
            errCb
        );
    },
};
