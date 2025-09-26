import {
    IResponseElementText,
    IResponseElementSetAttribute,
    IResponseElementCard as CoreIResponseElementCard,
    IResponseElementQuestion,
    IResponseElementTags,
    IResponseElementImage,
    IResponseElementVideo,
    IResponseElementRoomRate,
    IResponseElementGoto,
    IResponseElementSwitchText,
    IResponseElementHotelInfo,
    IResponseElementSetRecognizerScope,
    ResponseType,
} from 'kissbot-core';
export enum SetAttributeAction {
    set = 'set',
    remove = 'remove',
}

export enum SetAttributeType {
    any = '@sys.any',
    integer = '@sys.integer',
    number = '@sys.number',
    text = '@sys.text',
    date = '@sys.date',
    time = '@sys.time',
    email = '@sys.email',
    boolean = '@sys.boolean',
    cpf = '@sys.cpf',
    cnpj = '@sys.cnpj',
    command = '@sys.command',
}

export const fixedResponses = [ResponseType.REASSIGN_CONVERSATION, ResponseType.PRIVACY_POLICY];

export interface IResponseElementQuickReply {
    text: Array<string>;
    buttons: Array<ButtonInteraction>;
}

export interface ButtonInteraction {
    title: string;
    value: string;
    type: string;
}

export interface IResponseElementCard extends CoreIResponseElementCard {
    isElementCardValid?: boolean;
    footer?: string;
}

export type ResponseElement =
    | IResponseElementText
    | IResponseElementSetAttribute
    | IResponseElementCard
    | IResponseElementQuestion
    | IResponseElementTags
    | IResponseElementImage
    | IResponseElementVideo
    | IResponseElementRoomRate
    | IResponseElementHotelInfo
    | IResponseElementGoto
    | IResponseElementQuickReply
    | IResponseElementSetRecognizerScope
    | IResponseElementSwitchText;
