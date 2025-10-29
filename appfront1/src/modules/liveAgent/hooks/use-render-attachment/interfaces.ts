import { Activity, AttachmentFile } from '../../interfaces/activity.interface';
import { Conversation } from '../../interfaces/conversation.interface';

export interface UseRenderAttachmentParams {
    file?: AttachmentFile;
    activity: Activity;
    conversation: Conversation;
    openImage?: Function;
    handleReact?: () => void;
    handleReply?: () => Promise<void>;
    canReaction?: boolean;
    isFilesize?: boolean;
    clientMessage?: boolean;
}

export interface UseRenderAttachmentResult {
    attachmentElement: JSX.Element | null;
}
