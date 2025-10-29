import axios, { CancelTokenSource } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Workspace } from '../../../../../../model/Workspace';
import { DashboardService } from '../../../../services/DashboardService';
import type { ConversationFilterInterface } from '../../../ConversationFilter/props';
import { downloadFile } from '../../../../../../utils/downloadFile';

let cancelToken: CancelTokenSource | undefined = undefined;

export const useUserReport = () => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState();

    const downloadConversationAnalytics = useCallback(
        async (filters: ConversationFilterInterface, selectedWorkspace: Workspace, downloadType: string) => {
            if (!selectedWorkspace) return;

            let isSucess = true;

            if (cancelToken) {
                cancelToken.cancel();
            }

            setIsDownloading(true);
            const analytics = await DashboardService.getConversationsAnalyticsReport(
                {
                    query: {
                        // ...filters,
                        interval: '1M',
                        tags: filters.tags,
                        endDate: filters.endDate,
                        startDate: filters.startDate,
                        teamId: filters.teamId,
                        timezone: loggedUser.timezone,
                        workspaceId: selectedWorkspace._id,
                    },
                    downloadType,
                },
                undefined,
                (responseError) => {
                    setError(responseError);
                    isSucess = false;
                }
            );

            if (!isSucess) {
                setIsDownloading(false);
                return false;
            }

            downloadFile(analytics, 'relatorio', downloadType as 'csv' | 'xlsx');

            cancelToken = axios.CancelToken.source();

            isSucess = true;
            setIsDownloading(false);

            return isSucess;
        },
        [loggedUser.timezone]
    );

    useEffect(() => {
        return () => {
            if (cancelToken) {
                cancelToken.cancel();
            }
        };
    });

    return { isDownloading, error, downloadConversationAnalytics };
};
