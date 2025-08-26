import { ActionType } from '../enums/action-type.enum';

export interface IIntentActions {
    id: string;
    intentId: string;
    actionType: ActionType;
    targetValue: string;
    createdAt: Date;
}

export interface CreateIntentActionsData {
    intentId: string;
    actionType: ActionType;
    targetValue: string;
}

export interface UpdateIntentActionsData {
    intentActionsId: string;
    actionType?: ActionType;
    targetValue?: string;
}

export interface DeleteIntentActionsData {
    intentActionsId: string;
}

export interface ListIntentActionsFilter {
    intentId?: string;
}
