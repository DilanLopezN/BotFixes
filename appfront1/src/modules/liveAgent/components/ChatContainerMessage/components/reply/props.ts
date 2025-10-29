import { User } from 'kissbot-core';
import { ChannelConfig } from '../../../../../../model/Bot';
import { Team } from '../../../../../../model/Team';
import { Activity } from '../../../../interfaces/activity.interface';
import { TemplateMessage } from '../../../TemplateMessageList/interface';

export interface TextareaReplyProps {
    disabled: boolean;
    loggedUser: User;
    conversation: any;
    onChangeInputFile: (file?: any, template?: TemplateMessage) => any;
    focusTextArea: () => void;
    workspaceId: string;
    buttonTypes: any;
    emptyActivity: any;
    sendActivity: Function;
    setMessageStorage: Function;
    channels: ChannelConfig[];
    teams: Team[];
    isFocusOnReply?: boolean;
    setIsFocusOnReply: (onReplay: boolean) => void;
    replayActivity?: Activity;
    scrollToActivity?: Function;
}
