import { ResponseElement } from './ResponseElement';
import { ConditionMethodType, ResponseType } from 'kissbot-core';
import { IComment } from 'kissbot-core/lib';

export enum InteractionType {
    welcome = 'welcome',
    fallback = 'fallback',
    container = 'container',
    contextFallback = 'context-fallback',
    interaction = 'interaction',
}

export interface IParameter {
    //  alias: string;
    //  entity: string;
    name: string;
    type: string;
    typeId?: string;
    mandatory?: boolean;
    defaultValue?: any;
    value?: any;
}

export enum FilterType {
    attribute = 'attribute',
    lifespan = 'lifespan',
    trigger = 'trigger',
    json = 'json',
}

export interface ICondition {
    name?: string;
    operator?: ConditionMethodType;
    value?: string;
    type: FilterType;
    isConditionValid?: boolean | undefined;
}

export enum FilterOperator {
    or = 'or',
    and = 'and',
}

export enum reservationOriginOptions {
    hotel_website = 'Hotel website',
    telephone = 'telephone',
    other_agency = 'Other site / agency',
}

export interface IFilter {
    conditions: ICondition[];
    operator: FilterOperator;
}

export interface IResponse {
    _id?: string;
    id: string;
    type: ResponseType;
    elements: ResponseElement[];
    delay: number;
    sendTypping?: boolean;
    isResponseValid?: boolean;
    filter: IFilter;
}

export enum RecognizerType {
    ai = 'ai',
    keyword = 'keyword',
}

export interface IPart {
    value: string;
    type?: string;
    name?: string;
    mandatory?: boolean;
}

export interface IUserSay {
    parts: IPart[];
    id?: string;
    _id?: string;
}

export interface FieldDetails {
    required: boolean;
    visible: boolean;
    label: string;
}

export interface Language {
    language: String;
    responses?: IResponse[];
    userSays?: IUserSay[];
    userSaysIsValid?: boolean | undefined;
    intents?: string[];
}

export interface Interaction {
    name: string;
    description?: String;
    isCollapsed: Boolean;
    type: InteractionType;
    parameters?: IParameter[];
    languages: Language[];
    triggers: String[];
    action: String;
    children?: String[];
    path: String[];
    completePath?: String[];
    botId: String;
    labels: String[];
    parentId?: String;
    position: number | any;
    params?: any;
    comments: IComment[];
    deletedAt: Date;
    createdAt?: Date;
    reference: String;
    lastUpdateBy?: {
        userId: string;
        updatedAt: number;
    };
    _id: string;
    publishedAt?: string;
}
