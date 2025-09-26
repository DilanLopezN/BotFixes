import { notification } from 'antd';
import { ActivityType, IdentityType } from 'kissbot-core';
import { useSelector } from 'react-redux';
import { Activity } from '../../interfaces/activity.interface';
import { Conversation } from '../../interfaces/conversation.interface';
import { useSendNewActivityReaction } from '../use-send-new-activity-reaction';
import { MinimalActivity } from './interfaces';

export const useEmojiReaction = (
    setEmojiVisible: React.Dispatch<React.SetStateAction<boolean>>,
    activity: Activity,
    conversation: Conversation
) => {
    const { sendNewActivityReaction } = useSendNewActivityReaction();
    const { selectedWorkspace } = useSelector((state: any) => state.workspaceReducer);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);

    const handleEmojiSelect = async (emoji: string) => {
        const isUserMessage = activity.from?.type === 'user';
        const isHashValid = isUserMessage
            ? typeof activity.hash === 'string' && activity.hash.startsWith('wamid.')
            : /^[a-f\d]{24}$/i.test(activity.hash);

        if (!isHashValid) {
            notification.error({ message: 'Erro', description: 'Hash inválido para o tipo de atividade.' });
            return;
        }

        const activityData: MinimalActivity = {
            from: {
                _id: loggedUser._id,
                id: loggedUser._id,
                name: loggedUser.name,
                channelId: '',
                type: IdentityType.agent,
                contactId: '',
            },
            type: emoji ? ActivityType.message : activity.type,
            text: emoji,
            data: {
                reactionHash: activity.hash,
            },
        };

        try {
            await sendNewActivityReaction(selectedWorkspace?._id, conversation?._id, activityData);
        } catch (error) {
            console.error('Error sending emoji reaction:', error);
        }

        setEmojiVisible(false);
    };

    return {
        handleEmojiSelect,
    };
};
