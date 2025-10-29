import { FormikProps } from 'formik';
import { User } from 'kissbot-core';
import {
    TemplateCategory,
    TemplateMessage,
    TemplateStatus,
} from '../../../../../../../liveAgent/components/TemplateMessageList/interface';

export interface TemplatePermissionsProps extends FormikProps<TemplateMessage> {
    template: TemplateMessage;
    workspaceId: string;
    submitted: boolean;
    loadingRequest: boolean;
    setLoadingRequest: React.Dispatch<React.SetStateAction<boolean>>;
    user: User;
}

export interface WabaResult {
    channelConfigId: string;
    status: TemplateStatus | string;
    elementName: string;
    category: TemplateCategory;
    isChannelActive?: boolean;
}

export interface ChannelData {
    wabaResult: WabaResult;
    qtdChannels: number;
}
