import { User } from "kissbot-core";
import { Activity } from "../../interfaces/activity.interface";

export interface ChatMessageProps {
    activity: Activity;
    ownerMessage?: boolean;
    clientMessage?: boolean;
    botMessage?: boolean;
    attachment?: any;
    openImage?: Function;
    conversation?: any;
    renderTimestamp?: boolean;
    withError: boolean;
    retry: Function;
    quotedActivity: Activity | undefined;
    reactionText?: string[];
    scrollToActivity: Function;
    loggedUser: User;
    onReply?: () => void;
    sendReplayActivity: (activity: Activity) => void;
}