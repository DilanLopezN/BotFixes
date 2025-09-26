import axios, { CancelTokenSource } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Workspace } from '../../../../../../model/Workspace';
import { DashboardService } from '../../../../services/DashboardService';
import type { ConversationFilterInterface } from '../../../ConversationFilter/props';
import type { ConversationAnalytics } from './interfaces';

let cancelToken: CancelTokenSource | undefined = undefined;

export const useConversationAnalytics = () => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [conversationAnalytics, setConversationAnalytics] = useState<ConversationAnalytics[]>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState();

    const getConversationAnalytics = useCallback(
        async (filters: ConversationFilterInterface, selectedWorkspace: Workspace) => {
            if (!selectedWorkspace) return;

            let isSucess = false;

            if (cancelToken) {
                cancelToken.cancel();
            }

            setLoading(true);
            const analytics = await DashboardService.getConversationsAnalytics(
                {
                    ...filters,
                    timezone: loggedUser.timezone,
                    interval: '1d',
                    groupBy: 'user-resume-avg',
                    workspaceId: selectedWorkspace._id,
                },
                undefined,
                (responseError) => {
                    setError(responseError);
                    isSucess = false;
                }
            );

            cancelToken = axios.CancelToken.source();

            isSucess = true;
            setConversationAnalytics(analytics);
            setLoading(false);

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

    return { conversationAnalytics, loading, error, getConversationAnalytics };
};
