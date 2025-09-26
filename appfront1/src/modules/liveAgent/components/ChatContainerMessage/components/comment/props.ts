import { User } from 'kissbot-core';
import { ChannelConfig } from '../../../../../../model/Bot';

export interface TextareaCommentProps {
    conversation: any;
    buttonTypes: any;
    focusTextArea: Function;
    loggedUser: User;
    emptyActivity: any;
    sendActivity: Function;
    channels: ChannelConfig[];
    disabled: boolean;
}
