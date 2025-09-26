import { User } from 'kissbot-core';
import { ChannelConfig } from '../../../../model/Bot';
import { Team } from '../../../../model/Team';
import { Activity } from '../../interfaces/activity.interface';

export interface FilePreviewProps {
    filePreview: any;
    notification: Function;
    setFilePreview: Function;
    conversation: any;
    loggedUser: User;
    workspaceId: string;
    channels: ChannelConfig[];
    teams: Team[];
    isFocusOnReply?: boolean;
    setIsFocusOnReply: (onReplay: boolean) => void;
    replayActivity: Activity;
}
