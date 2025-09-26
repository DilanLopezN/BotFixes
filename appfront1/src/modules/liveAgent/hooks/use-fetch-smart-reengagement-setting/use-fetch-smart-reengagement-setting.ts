import { useEffect, useState } from 'react';
import { ApiError } from '../../../../interfaces/api-error.interface';
import { fetchSmartReengagementSettingById } from '../../service/fetch-smart-reengagement-setting-by-id';
import { SmartReengagementSetting } from '../../service/fetch-smart-reengagement-setting-by-id/interfaces';
import { UseFetchSmartReengagementSettingResult } from './interfaces';

export const useFetchSmartReengagementSetting = (
    workspaceId: string | undefined,
    smtReSettingId: string | undefined
): UseFetchSmartReengagementSettingResult => {
    const [data, setData] = useState<SmartReengagementSetting | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ApiError | undefined>(undefined);

    useEffect(() => {
        if (!workspaceId || !smtReSettingId) {
            setData(undefined);
            setError(undefined);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(undefined);
            try {
                const result = await fetchSmartReengagementSettingById(workspaceId, smtReSettingId);
                setIsLoading(false);
                setData(result);
            } catch (err) {
                console.error('Erro ao buscar regra de reengajamento:', err);
                setError(err as ApiError);
                setData(undefined);
            }
        };

        fetchData();
    }, [workspaceId, smtReSettingId]);

    return {
        data,
        isLoading,
        error,
    };
};
