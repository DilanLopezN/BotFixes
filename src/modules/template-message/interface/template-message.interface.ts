import { Document } from 'mongoose';
import { TemplateCategory, TemplateLanguage } from '../../channels/gupshup/services/partner-api.service';
import { TemplateButtonType, TemplateStatus, TemplateType } from '../schema/template-message.schema';

export interface TemplateVariable {
    label: string;
    value: string;
    type: string;
    required: boolean;
    sampleValue?: string;
}

interface TemplateMessageChannel {
    channelConfigId: string;
    appName: string;
    wabaTemplateId?: string;
    elementName: string;
    status: TemplateStatus;
    rejectedReason?: string;
    category?: TemplateCategory;
    exampleMedia?: string;
}

export type WabaResultType = {
    [channelConfigId: string]: TemplateMessageChannel;
};

interface TemplateButton {
    type: TemplateButtonType;
    text: string;
    url?: string;
    example?: string[];
    flowDataId?: number;
    flowName?: string;
}

export interface TemplateMessage extends Document {
    message: string;
    name: string;
    isHsm: boolean;
    active?: boolean;
    canEdit?: boolean;
    userId: string;
    workspaceId: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
    teams?: string[];
    channels?: string[];
    channelsBackup?: string[];
    variables: TemplateVariable[];
    type?: TemplateType;
    wabaResult?: WabaResultType;
    whatsappTemplateId?: string;
    status?: TemplateStatus;
    buttons?: TemplateButton[];
    rejectedReason?: string;
    languageCode?: TemplateLanguage;
    fileUrl?: string;
    fileContentType?: string;
    fileOriginalName?: string;
    fileKey?: string;
    fileSize?: number;
    action?: string;
}
