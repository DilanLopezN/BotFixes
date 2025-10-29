import { Activity, AttachmentFile } from "../../interfaces/activity.interface";
import { Conversation } from "../../interfaces/conversation.interface";

export interface ActivityFileProps {
    ownerMessage?: boolean;
    clientMessage?: boolean;
    botMessage?: boolean;
    renderTimestamp?: boolean;
    activity: Activity;
    quotedActivity: Activity | undefined;
    openImage?: Function;
    scrollToActivity: Function;
    file: AttachmentFile;
    conversation: Conversation;
    setEmojiVisible: React.Dispatch<React.SetStateAction<boolean>>;
    emojiVisible: boolean;
    canReaction: boolean;
    handleReact: () => void;
    handleReply: () => Promise<void>;
}
