import { User } from 'kissbot-core';
import { ChannelConfig } from '../../../../model/Bot';
import { Team } from '../../../../model/Team';
import { Activity } from '../../interfaces/activity.interface';
import { TemplateMessage } from '../TemplateMessageList/interface';
export interface FilePreviewItem {
    id: string;
    file: File;
    preview: string | ArrayBuffer | null;
    isImage: boolean;
    isPdf: boolean;
    isVideo: boolean;
    template?: TemplateMessage; // para compatibilidade com templates
    message?: string;
}

export interface FilePreviewProps {
    filePreview: FilePreviewItem[] | any; // Array de arquivos ou objeto único (compatibilidade)
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
