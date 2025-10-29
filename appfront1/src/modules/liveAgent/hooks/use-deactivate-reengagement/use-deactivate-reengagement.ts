import { notification } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../interfaces/api-error.interface';
import { useLanguageContext } from '../../../i18n/context';
import { deactivateSmartReengagement } from '../../service/deactivate-smart-reengagement';
import { useFetchUniqueConversation } from '../use-unique-conversation';
import { useRemiOptimistic } from '../../context/RemiOptimisticContext';

export const useDeactivateReengagement = () => {
    const { setOptimisticStatus } = useRemiOptimistic();
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ApiError>();
    const { getTranslation } = useLanguageContext();
    const { fetchData: refetchConversation } = useFetchUniqueConversation();

    const deactivateReengagement = async (
        conversationId: string,
        originalSmtReId: string | null | undefined
    ): Promise<boolean> => {
        const workspaceId = selectedWorkspace?._id;
        if (!workspaceId || isLoading) return false;
        try {
            setError(undefined);
            setIsLoading(true);

            await deactivateSmartReengagement(workspaceId, conversationId);
            setOptimisticStatus(conversationId, { smtReId: null, isWithSmtRe: false });

            await refetchConversation(workspaceId, conversationId);
            setIsLoading(false);
            notification.success({
                message: getTranslation('Sucesso'),
                description: getTranslation('Reengajamento automático desativado.'),
            });

            return true;
        } catch (err) {
            console.error('Erro ao desativar reengajamento:', err);
            setError(err as ApiError);
            setIsLoading(false);
            notification.error({
                message: getTranslation('Erro'),
                description: getTranslation('Falha ao desativar o reengajamento automático.'),
            });
            setOptimisticStatus(conversationId, { smtReId: originalSmtReId });
            return false;
        }
    };

    return { deactivateReengagement, isLoading, error };
};
