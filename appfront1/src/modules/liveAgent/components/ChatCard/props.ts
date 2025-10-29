import { User } from 'kissbot-core';
import { Activity } from '../../interfaces/activity.interface';

export interface ChatCardProps {
    activity: Activity;
    ownerMessage?: boolean;
    clientMessage?: boolean;
    botMessage?: boolean;
    renderTimestamp?: boolean;
    settings?: any;
    conversationId: string;
    quotedActivity: Activity | undefined;
    reactionText?: string[];
    conversation: any;
    loggedUser: User;
    onReply?: () => void;
    sendReplayActivity: (activity: Activity) => void;
    openImage?: Function;
    withError: boolean;
    retry: Function;
    footer?: string;
}
