import { User } from 'kissbot-core';
import { ChannelConfig } from '../../../../model/Bot';
import { Team } from '../../../../model/Team';
import { TemplateMessage } from '../TemplateMessageList/interface';
import { Activity } from '../../interfaces/activity.interface';

export interface TextAreaAutoSizeProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    isFocusOnReply?: boolean;
    messageToReply?: string;
    replayActivity?: Activity;
    scrollToActivity?: Function;
    setIsFocusOnReply?: (onReplay: boolean) => void;
    isReplying?: boolean;
    setIsReplying?: (onReplay: boolean) => void;
}

export interface ChatContainerMessageProps {
    conversation: any;
    loggedUser: User;
    readingMode: boolean;
    workspaceId?: string;
    sendActivity: Function;
    setMessageStorage: Function;
    onChangeInputFile: (file?: any, template?: TemplateMessage) => any;
    onMessageTypeChange?: (type: 'reply' | 'comment') => void;
    teams: Team[];
    channels: ChannelConfig[];
    forceUpdateConversation: () => void;
    onUpdatedConversationSelected: Function;
    isFocusOnReply?: boolean;
    setIsFocusOnReply?: (onReplay: boolean) => void;
    replayActivity: Activity;
    scrollToActivity: Function;
}
