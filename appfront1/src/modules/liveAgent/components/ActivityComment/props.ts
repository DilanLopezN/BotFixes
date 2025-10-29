import { Activity } from '../../interfaces/activity.interface';
import { Conversation } from '../../interfaces/conversation.interface';



export interface ActivityCommentProps {
    ownerMessage?: boolean;
    renderTimestamp?: boolean;
    activity: Activity;
    conversation: Conversation;
}
