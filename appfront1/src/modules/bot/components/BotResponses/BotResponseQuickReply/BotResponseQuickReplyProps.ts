import {BotResponseProps} from "../interfaces";
import {Interaction} from "../../../../../model/Interaction";

export interface BotResponseQuickReplyProps extends BotResponseProps {
    interactionList: Array<Interaction>
    currentInteraction: Interaction
}

export interface BotResponseQuickReplyState {
    openedButtonIndex: any;
}
