import { IResponse } from "../../../../../model/Interaction";

export enum BotResponseMoveDirection{
    UP = "UP",
    DOWN = "DOWN"
}

export interface BotResponseWrapperProps{
    response: IResponse;
    isLastResponse: boolean;
    isFirstResponse: boolean;
    submitted: boolean;
    onChange: (response: IResponse) => any;
    onMoveInteraction: (direction: BotResponseMoveDirection) => any;
    onDelete: () => any;
    onClone: (toInteractionId) => any;
    checked: (event, idResponse) => any;
    idResponseList: string[];
    children?: React.ReactNode
}

export interface BotResponseWrapperState{
    response: IResponse;
}
