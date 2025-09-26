import {IUserSay, Interaction} from "../../../../../model/Interaction";
import { BotAttribute } from "../../../../../model/BotAttribute";
import { Entity } from "kissbot-core";

export interface UserSaysTabProps {
    selectedLanguage: string;
    currentInteraction: Interaction;
    botAttributes: Array<BotAttribute>;
    entitiesList: Array<Entity>
    modalInteractionSubmitted: boolean;
    setCurrentInteraction: (...params) => any;
    children?: React.ReactNode;
}

export interface UserSaysTabState {
    userSays: IUserSay[]
}
