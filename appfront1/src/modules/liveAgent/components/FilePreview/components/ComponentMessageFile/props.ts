import { User } from 'kissbot-core';
import { Dispatch, SetStateAction } from 'react';
import { ChannelConfig } from '../../../../../../model/Bot';
import { Team } from '../../../../../../model/Team';
import { TemplateMessage } from '../../../TemplateMessageList/interface';

export interface ComponentMessageFileProps {
    conversation: any;
    loggedUser: User;
    uploadingFile: boolean;
    currentMessage: string;
    setCurrentMessage: (value: any) => void;
    setTemplateVariableValues: (value: any) => void;
    channels: ChannelConfig[];
    teams: Team[];
    workspaceId: string;
    uploadFile: () => void;
    template: TemplateMessage | undefined;
    closePreviewFile: () => void;
}