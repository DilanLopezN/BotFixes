import { IFilter } from './filter.interface';
import {
    IResponseElementButtons,
    IResponseElementCard,
    IResponseElementMessage,
    IResponseElementSetAttribute,
    IResponseElementWebhook,
} from './responseType.interface';
import { ResponseType } from 'kissbot-core';

export enum ResponseButtonType {
    goto = 'goto',
    url = 'url',
    phone = 'phone',
}

export enum InteractionType {
    welcome = 'welcome',
    fallback = 'fallback',
    contextFallback = 'context-fallback',
    interaction = 'interaction',
    container = 'container',
}

type FilterType = IFilter;

export type ElementType =
    | IResponseElementWebhook
    | IResponseElementMessage
    | IResponseElementSetAttribute
    | IResponseElementCard
    | IResponseElementButtons;

export interface IResponse {
    _id: string;
    type: ResponseType;
    elements: ElementType[];
    delay: number;
    sendTypping: boolean;
    filter: FilterType;
}

export enum FixedResponsesWelcome {
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    REASSIGN_CONVERSATION = 'REASSIGN_CONVERSATION',
}
