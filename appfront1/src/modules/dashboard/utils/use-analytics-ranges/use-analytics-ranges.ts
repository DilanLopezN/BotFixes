import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Action } from 'redux';
import { Workspace } from '../../../../model/Workspace';
import { WorkspaceActions } from '../../../workspace/redux/actions';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import { RangeValue } from '../../components/TabRealTime/components/use-get-column-search/interfaces';

export const useAnalyticsRanges = (storageKey: string, selectedWorkspace: Workspace) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialAnalyticsRanges, setInitialAnalyticsRanges] = useState<any>({});
    const dispatch = useDispatch();

    const loadWorkspaceAnalyticsRanges = useCallback(
        async (selectedWorkspace: Workspace) => {
            setLoading(true);
            setError(null);
            try {
                const analyticsRanges = selectedWorkspace.analyticsRanges?.[storageKey];
                if (analyticsRanges) {
                    const filters = {};

                    for (let key in analyticsRanges) {
                        filters[key] = analyticsRanges[key] || [null, null];
                    }

                    setInitialAnalyticsRanges(analyticsRanges);
                }

                setLoading(false);
            } catch (err) {
                setError(err.message || 'Erro ao carregar os analyticsRanges');
                setLoading(false);
            }
        },
        [storageKey]
    );

    const updateWorkspaceAnalyticsRanges = useCallback(
        async (analyticsRanges: Record<string, any>) => {
            setLoading(true);
            setError(null);
            try {
                const updatedWorkspace = {
                    ...selectedWorkspace,
                    analyticsRanges,
                };

                const result: Workspace = await WorkspaceService.updateWorkspace(
                    selectedWorkspace._id,
                    updatedWorkspace,
                    setError
                );
                if (result) {
                    dispatch(WorkspaceActions.setSelectedWorkspace(result) as Action);
                }
                setLoading(false);
                return result;
            } catch (err) {
                setError(err.message || 'Erro ao atualizar analyticsRanges');
                setLoading(false);
                throw err;
            }
        },
        [dispatch, selectedWorkspace]
    );

    const saveAnalyticsRange = useCallback(
        async (key: string, value: RangeValue) => {
            setLoading(true);
            setError(null);
            try {
                let updatedAnalyticsRanges = { ...selectedWorkspace.analyticsRanges };

                if (!updatedAnalyticsRanges[storageKey]) {
                    updatedAnalyticsRanges[storageKey] = {};
                }

                updatedAnalyticsRanges[storageKey][key] = value;

                const result = await updateWorkspaceAnalyticsRanges(updatedAnalyticsRanges);
                setLoading(false);
                return result;
            } catch (err) {
                setError(err.message || 'Erro ao salvar analyticsRange');
                setLoading(false);
                throw err;
            }
        },
        [selectedWorkspace.analyticsRanges, storageKey, updateWorkspaceAnalyticsRanges]
    );

    const removeAnalyticsRange = useCallback(
        async (key: string) => {
            setLoading(true);
            setError(null);
            try {
                const updatedAnalyticsRanges = { ...selectedWorkspace.analyticsRanges };

                if (updatedAnalyticsRanges[storageKey]) {
                    delete updatedAnalyticsRanges[storageKey][key];
                }

                const result = await updateWorkspaceAnalyticsRanges(updatedAnalyticsRanges);
                setLoading(false);
                return result;
            } catch (err) {
                setError(err.message || 'Erro ao remover analyticsRange');
                setLoading(false);
                throw err;
            }
        },
        [selectedWorkspace.analyticsRanges, storageKey, updateWorkspaceAnalyticsRanges]
    );

    useEffect(() => {
        if (selectedWorkspace) {
            loadWorkspaceAnalyticsRanges(selectedWorkspace);
        }
    }, [selectedWorkspace, loadWorkspaceAnalyticsRanges]);

    return {
        initialAnalyticsRanges,
        updateWorkspaceAnalyticsRanges,
        saveAnalyticsRange,
        removeAnalyticsRange,
        loading,
        error,
    };
};
