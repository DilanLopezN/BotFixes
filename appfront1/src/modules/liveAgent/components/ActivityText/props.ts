import { User } from 'kissbot-core';
import { Activity } from '../../interfaces/activity.interface';
import { Conversation } from '../../interfaces/conversation.interface';

export interface ActivityTextProps {
    ownerMessage?: boolean;
    clientMessage?: boolean;
    botMessage?: boolean;
    renderTimestamp?: boolean;
    activity: Activity;
    quotedActivity: Activity | undefined;
    scrollToActivity: Function;
    loggedUser: User;
    conversation: Conversation;
    setEmojiVisible: React.Dispatch<React.SetStateAction<boolean>>;
    emojiVisible: boolean;
    canReaction: boolean;
}
