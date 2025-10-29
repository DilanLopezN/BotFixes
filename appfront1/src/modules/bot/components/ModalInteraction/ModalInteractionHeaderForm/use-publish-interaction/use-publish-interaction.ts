import { notification } from 'antd';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguageContext } from '../../../../../i18n/context';
import { BotService } from '../../../../services/BotService';
import { ApiError } from '../../../../../../interfaces/api-error.interface';

export const usePublishInteraction = () => {
    const [loading, setLoading] = useState(false);

    const { workspaceId = '', botId = '' } = useParams<{ workspaceId: string; botId: string }>();
    const { getTranslation } = useLanguageContext();
    let error: ApiError;

    const publishInteraction = useCallback(
        async (interactionId: string) => {
            setLoading(true);

            await BotService.publishInteraction(workspaceId, botId, interactionId, (err) => (error = err));

            if (error) {
                notification.error({
                    message: getTranslation('Erro'),
                    description: getTranslation('An error has occurred. Check the fields'),
                    placement: 'bottomRight',
                });
                setLoading(false);
            } else {
                notification.success({
                    message: getTranslation('Published to the bot'),
                    description: getTranslation('Published successfully'),
                    placement: 'bottomRight',
                });
                setLoading(false);
            }
        },
        [botId, getTranslation, workspaceId]
    );

    return {
        loading,
        publishInteraction,
    };
};
