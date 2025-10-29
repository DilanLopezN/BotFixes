import { notification } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../../interfaces/api-error.interface';
import { fetchAllRemiSettings } from '../../service/fetch-all-remi-settings';
import { RemiConfigData } from './interfaces';

export const useAllRemiSettings = (workspaceId: string | undefined) => {
    const [data, setData] = useState<RemiConfigData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<ApiError | null>(null);

    const fetchRemiSettings = useCallback(async () => {
        if (!workspaceId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetchAllRemiSettings(workspaceId);
            setData(response.data);
        } catch (err) {
            setError(err as ApiError);
            notification.error({ message: 'Error' });
        } finally {
            setIsLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        if (workspaceId) {
            fetchRemiSettings();
        }
    }, [fetchRemiSettings, workspaceId]);

    return {
        data,
        isLoading,
        error,
        fetchRemiSettings,
    };
};
