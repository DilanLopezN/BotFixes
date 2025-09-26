export interface TemplateVariable {
    label: string;
    value: string;
    type: string;
    required: boolean;
    sampleValue?: string;
    _id?: string;
}

interface TemplateMessageChannel {
    channelConfigId: string;
    appName: string;
    wabaTemplateId?: string;
    elementName: string;
    status: TemplateStatus;
    category: TemplateCategory;
    rejectedReason?: string;
}

export type WabaResultType = {
    [channelConfigId: string]: TemplateMessageChannel;
};

export enum TemplateCategory {
    MARKETING = 'MARKETING',
    UTILITY = 'UTILITY',
    AUTHENTICATION = 'AUTHENTICATION',
}

export enum TemplateType {
    message = 'message',
    file = 'file',
}

export enum TemplateStatus {
    REJECTED = 'rejected',
    APPROVED = 'approved',
    DELETED = 'deleted',
    DISABLED = 'disabled',
    AWAITING_APPROVAL = 'awaiting_approval',
    PENDING = 'pending',
    ERROR_ONSUBMIT = 'error_onsubmit',
}

export enum TemplateButtonType {
    QUICK_REPLY = 'QUICK_REPLY',
    URL = 'URL',
    FLOW = 'FLOW',
}

export interface TemplateButton {
    type: TemplateButtonType;
    text: string;
    url?: string;
    flowDataId?: string;
    flowName?: string;
    example?: string[];
}

export interface TemplateMessage {
    message: string;
    userId: string;
    workspaceId: string;
    _id?: string;
    isHsm: boolean;
    active?: boolean;
    canEdit: boolean;
    name: string;
    createdAt?: string;
    updatedAt?: string;
    tags: string[];
    teams?: string[];
    channels?: string[];
    variables: TemplateVariable[];
    type?: TemplateType;
    fileUrl?: string;
    fileContentType?: string;
    fileOriginalName?: string;
    fileKey?: string;
    fileSize?: number;
    wabaResult?: WabaResultType;
    category?: TemplateCategory;
    whatsappTemplateId?: string;
    status?: TemplateStatus;
    rejectedReason?: string;
    buttons?: TemplateButton[];
    action?: string;
    footerMessage?: string;
}

export interface NewVariable {
    value: TemplateVariable['value'];
}
