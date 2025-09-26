import { I18nProps } from './../../../../i18n/interface/i18n.interface';
import { BotResponseMoveDirection } from "../BotResponseWrapper/BotResponseWrapperProps";
import { Interaction, IResponse } from "../../../../../model/Interaction";

export interface ResponseControlProps extends I18nProps {
    isShowUpArrow: boolean;
    isShowDownArrow: boolean;
    interactionList: Interaction[];
    currentInteraction: Interaction;
    onMoveInteraction: (direction: BotResponseMoveDirection) => any;
    onDelete: () => any;
    onClone: (toInteractionId) => any;
    response: IResponse;
    selectedLanguage: any;
    setInteractionList: any;
    match: any;
    checked: (event, idResponse) => any;
    idResponseList: string[];
}

export interface ResponseControlState {
    idInteractionCopy: string;
}