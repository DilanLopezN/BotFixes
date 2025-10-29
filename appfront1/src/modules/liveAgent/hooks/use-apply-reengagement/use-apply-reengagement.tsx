import { notification } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiError } from '../../../../interfaces/api-error.interface';
import { useLanguageContext } from '../../../i18n/context';
import { applySmartReengagement } from '../../service/apply-smart-reengagement';

export const useApplyReengagement = () => {
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ApiError>();
    const { getTranslation } = useLanguageContext();

    const applyReengagement = async (conversationId: string, smtReSettingId: string): Promise<boolean> => {
        const workspaceId = selectedWorkspace?._id;
        if (!workspaceId || isLoading) return false;

        try {
            setError(undefined);
            setIsLoading(true);
            await applySmartReengagement(workspaceId, conversationId, smtReSettingId);
            setIsLoading(false);
            notification.success({
                message: getTranslation('Sucesso'),
                description: getTranslation('Regra de reengajamento aplicada com sucesso.'),
            });
            return true;
        } catch (err) {
            console.error('Erro ao aplicar regra de reengajamento:', err);
            setError(err as ApiError);
            notification.error({
                message: getTranslation('Erro'),
                description: getTranslation('Falha ao aplicar a regra de reengajamento.'),
            });
            return false;
        }
    };

    return { applyReengagement, isLoading, error };
};
