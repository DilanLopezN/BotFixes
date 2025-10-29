import { notification } from 'antd';
import { useCallback, useState } from 'react';
import { useLanguageContext } from '../../../i18n/context';
import { Activity } from '../../interfaces/activity.interface';
import { LiveAgentService } from '../../service/LiveAgent.service';

export const useSendNewActivityReaction = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const { getTranslation } = useLanguageContext();

    const sendNewActivityReaction = useCallback(
        async (workspaceId: string, conversationId: string, activity: Partial<Activity>): Promise<any> => {
            setLoading(true);
            setError(null);
            const response = await LiveAgentService.sendNewActivityReaction(
                workspaceId,
                conversationId,
                activity,
                (err) => {
                    if (err?.error || err?.statusCode === 400) {
                        let message: string;
                        switch (err.error) {
                            case 'INVALID_TYPE_ACTIVITY':
                                message = getTranslation('Invalid file type for reaction.');
                                break;
                            default:
                                message = getTranslation('An error occurred, please try again later.');
                        }
                        setError(err.message);
                        notification.error({
                            message: getTranslation('Erro'),
                            description: getTranslation(message),
                        });
                    }
                }
            ).then((success) => {
                setLoading(false);
            });

            return response;
        },
        [getTranslation]
    );

    return { sendNewActivityReaction, loading, error };
};
