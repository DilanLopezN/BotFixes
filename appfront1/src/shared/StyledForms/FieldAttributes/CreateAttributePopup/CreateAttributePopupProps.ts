import { RouteComponentProps } from "react-router";
import { Interaction } from "../../../../model/Interaction";
import { BotAttribute } from "../../../../model/BotAttribute";

export interface CreateAttributePopupProps extends RouteComponentProps{
    onChange: (...params) => any;
    data: any;
    currentInteraction: Interaction;
    setBotAttributes: (botAttrs: Array<BotAttribute>) => any;
    botAttributes: Array<BotAttribute>;
}

export interface CreateAttributePopupState {
    disabled: boolean;
}