import { useState } from 'react';
import { ApiError } from '../../../../../../../../interfaces/api-error.interface';
import { ExtractResumeType } from '../../../../../../interfaces/send-setting';
import { DiagnosticsService } from '../../../../../../service/diagnostics-service';
import { ConsultFlowFormValues, ExtractionData } from '../../components/send-setting-actions/interfaces';

export const useManualExtraction = (workspaceId: string, extractResumeType: ExtractResumeType, scheduleId?: number) => {
    const [loading, setLoading] = useState(false);
    let errorResponse: ApiError;

    const runManualExtraction = async (startDate: string, endDate: string) => {
        if (!scheduleId) return;

        setLoading(true);

        await DiagnosticsService.runManualExtraction(
            workspaceId,
            {
                scheduleSettingId: scheduleId,
                extractStartDate: startDate,
                extractEndDate: endDate,
                extractResumeType,
            },
            (err) => (errorResponse = err)
        );
        setLoading(false);
    };

    const getError = () => errorResponse;

    return { runManualExtraction, loading, getError };
};

export const useFetchExtractions = (workspaceId: string, scheduleId?: number) => {
    const [loading, setLoading] = useState(false);
    const [extractions, setExtractions] = useState<ExtractionData[]>([]);
    let errorResponse: ApiError;

    const fetchExtractions = async () => {
        if (!scheduleId) return;

        setLoading(true);
        const result = await DiagnosticsService.listDiagnosticExtractions(
            workspaceId,
            { scheduleSettingId: scheduleId },
            (err) => (errorResponse = err)
        );
        setLoading(false);

        setExtractions(result);
    };
    const getError = () => errorResponse;
    return { fetchExtractions, extractions, loading, getError };
};

export const useListExtractData = (workspaceId: string, extractResumeType: ExtractResumeType, scheduleId?: number) => {
    const [loading, setLoading] = useState(false);
    const [jsonData, setJsonData] = useState(null);
    let errorResponse: ApiError;

    const listExtractData = async (startDate: string, endDate: string) => {
        if (!scheduleId) return;

        setLoading(true);
        const result = await DiagnosticsService.listExtractData(
            workspaceId,
            {
                scheduleSettingId: scheduleId,
                extractStartDate: startDate,
                extractEndDate: endDate,
                extractResumeType,
            },
            (err) => (errorResponse = err)
        );
        setLoading(false);

        setJsonData(result);
    };
    const getError = () => errorResponse;
    return { listExtractData, jsonData, loading, getError };
};

export const useConsultFlowData = (workspaceId: string, data: ConsultFlowFormValues, integrationId?: string) => {
    const [loading, setLoading] = useState(false);
    const [jsonFlowData, setJsonFlowData] = useState(null);
    let errorResponse: ApiError;

    const consultFlowData = async () => {
        if(!integrationId) return
        if (!data.trigger && data.scheduleIds.length === 0) return;

        setLoading(true);
        const result = await DiagnosticsService.consultFlowData(
            workspaceId,
            {
                ...data,
                integrationId,
            },
            (err) => (errorResponse = err)
        );
        setJsonFlowData(result);
        setLoading(false);
    };
    const getError = () => errorResponse;
    return { consultFlowData, jsonFlowData, loading, getError };
};