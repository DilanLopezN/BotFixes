import { useEffect, useState } from 'react';
import { addNotification } from '../../../../../utils/AddNotification';
import { WorkspaceService } from '../../../services/WorkspaceService';
import { Workspace } from '../../../../../model/Workspace';

export const useGetWorkspace = (workspaceList, params, history, setSelectedWorkspace) => {
    const [workspace, setWorkspace] = useState<Workspace | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWorkspace = async () => {
            try {
                let currentWorkspace;

                const existWorkspace =
                    workspaceList && workspaceList.find((workspace) => workspace._id === params.workspaceId);

                if (existWorkspace) {
                    currentWorkspace = existWorkspace;
                } else {
                    currentWorkspace = await WorkspaceService.getWorkspace(params.workspaceId);
                }

                if (!!currentWorkspace) {
                    setWorkspace(currentWorkspace);
                    setSelectedWorkspace(currentWorkspace);
                } else {
                    if (!currentWorkspace) {
                        history.push('/not-found');
                    }
                }
            } catch (error) {
                setError(error);
                addNotification({
                    type: 'warning',
                    duration: 5000,
                    title: 'Error',
                    message: 'Não é possível remover um atributo em uso',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspace();

        return () => {};
    }, [workspaceList, params.workspaceId, history, setSelectedWorkspace]);

    return { workspace, loading, error };
};
