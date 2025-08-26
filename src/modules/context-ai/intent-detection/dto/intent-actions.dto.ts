import { IsString, IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { ActionType } from '../enums/action-type.enum';

export class CreateIntentActionsDto {
    @IsEnum(ActionType)
    @IsNotEmpty()
    actionType: ActionType;

    @IsString()
    @IsNotEmpty()
    targetValue: string;

    @IsUUID()
    @IsNotEmpty()
    intentId: string;
}

export class UpdateIntentActionsDto {
    @IsUUID()
    @IsNotEmpty()
    intentActionsId: string;

    @IsEnum(ActionType)
    actionType?: ActionType;

    @IsString()
    targetValue?: string;
}

export class DeleteIntentActionsDto {
    @IsUUID()
    @IsNotEmpty()
    intentActionsId: string;
}

export class GetIntentActionsDto {
    @IsUUID()
    @IsNotEmpty()
    intentActionsId: string;
}

export class ListIntentActionsByIntentDto {
    @IsUUID()
    @IsNotEmpty()
    intentId: string;
}