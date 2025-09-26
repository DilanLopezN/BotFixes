import { ReduxType } from "../../../interfaces/ReduxTypes";

export class BotTypesClass implements ReduxType {
    prefix = "BOT__";
    SET_CURRENT_BOT = this.prefix + "SET_CURRENT_BOT";
    SET_CURRENT_CHANNEL = this.prefix + "SET_CURRENT_CHANNEL";
    SET_INTERACTION_LIST = this.prefix + "SET_INTERACTION_LIST";
    SET_SELECTED_LANGUAGE = this.prefix + "SET_SELECTED_LANGUAGE";
    SET_CURRENT_INTERACTION = this.prefix + "SET_CURRENT_INTERACTION";
    SET_UNCHANGED_INTERACTION = this.prefix + "SET_UNCHANGED_INTERACTION";
    SET_MODAL_SUBMITTED = this.prefix + "SET_MODAL_SUBMITTED";
    SET_BOT_ATTRIBUTES = this.prefix + "SET_BOT_ATTRIBUTES";
    SET_BOT_LIST = this.prefix + "SET_BOT_LIST";
    SET_VALIDATE_INTERACTION = this.prefix + "SET_VALIDATE_INTERACTION";
    SET_CURRENT_EXECUTING_INTERACTION = this.prefix + "SET_CURRENT_EXECUTING_INTERACTION";
    SEARCH_INTERACTION = this.prefix + "SEARCH_INTERACTION";
    SET_CHANNEL_LIST = this.prefix + "SET_CHANNEL_LIST";
    UPDATE_CHANNEL = this.prefix + "UPDATE_CHANNEL";
    DELETE_CHANNEL = this.prefix + "DELETE_CHANNEL";
    ADD_CHANNEL = this.prefix + "ADD_CHANNEL";
    RESET_STORE = this.prefix + "RESET_STORE";
}

export const BotTypes = new BotTypesClass();
