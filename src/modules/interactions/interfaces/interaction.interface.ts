import { InteractionType } from './response.interface';
import { IParameter } from './parameter.interface';
import { Document } from 'mongoose';
import { ILanguageInteraction } from './language.interface';
import { Comment } from './comment.interface';

export enum OperatorType {
    equal = 'equal',
    not_equal = 'not-equal',
    empty = 'empty',
    constains = 'constains',
    not_constains = 'not-constains',
    greater_than = 'greater-than',
    less_than = 'less-than',
    greater_than_or_equals = 'greater-than-or-equals',
}

export interface Interaction extends Document {
    name: string;
    action: string;
    description?: string;
    isCollapsed: Boolean;
    type: InteractionType;
    parameters?: IParameter[];
    languages: ILanguageInteraction[];
    comments: Comment[];
    triggers: string[];
    labels?: string[];
    children?: string[];
    path?: string[];
    completePath?: string[];
    botId: string;
    workspaceId: string;
    parentId?: string;
    position?: Number;
    params?: any;
    deletedAt?: Date;
    reference?: string;
    lastUpdateBy?: {
        userId?: string;
        updatedAt?: number;
    };
    updatedAt?: string;
    createdAt?: string;
    publishedAt?: string;
}
