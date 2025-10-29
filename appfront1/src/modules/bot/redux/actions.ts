import { Action } from "../../../interfaces/ReduxAction";
import { BotTypes } from "./types";
import { Bot, ChannelConfig } from "../../../model/Bot";
import { Interaction } from "../../../model/Interaction";
import { LANGUAGE } from "./redux-interface";
import { BotAttribute } from "../../../model/BotAttribute";
import { BotService } from "../services/BotService";
import { AnyAction } from "redux";

export const BotActions = {
    setCurrentBot(bot: Bot): Action {
        return {
            type: BotTypes.SET_CURRENT_BOT,
            payload: bot
        }
    },
    setCurrentChannel(channel: ChannelConfig | undefined): Action {
        return {
            type: BotTypes.SET_CURRENT_CHANNEL,
            payload: channel
        }
    },
    setInteractionList(interactionList: Array<Interaction>): Action {
        return {
            type: BotTypes.SET_INTERACTION_LIST,
            payload: interactionList
        }
    },
    setSelectedLanguage(language: LANGUAGE): Action {
        return {
            type: BotTypes.SET_SELECTED_LANGUAGE,
            payload: language
        }
    },
    setCurrentInteraction(interaction: Interaction): Action {
        return {
            type: BotTypes.SET_CURRENT_INTERACTION,
            payload: interaction
        }
    },
    setUnchangedInteraction(interaction: Interaction): Action {
        return {
            type: BotTypes.SET_UNCHANGED_INTERACTION,
            payload: interaction
        }
    },
    setValidateInteraction(interaction: Interaction): Action {
        return {
            type: BotTypes.SET_VALIDATE_INTERACTION,
            payload: interaction
        }
    },
    setModalSubmitted(submitted: boolean): Action {
        return {
            type: BotTypes.SET_MODAL_SUBMITTED,
            payload: submitted
        }
    },
    setBotAttributes(botAttributes: Array<BotAttribute>): Action {
        return {
            type: BotTypes.SET_BOT_ATTRIBUTES,
            payload: botAttributes
        }
    },
    setBotList(botList: Array<Bot>): Action {
        return {
            type: BotTypes.SET_BOT_LIST,
            payload: botList
        }
    },
    setCurrentExecutingInteraction(interactionId: string): Action {
        return {
            type: BotTypes.SET_CURRENT_EXECUTING_INTERACTION,
            payload: interactionId
        }
    },
    setSearchInteraction(search: string): Action | {value: string, field: string} {
        return {
            type: BotTypes.SEARCH_INTERACTION,
            payload: search
        }
    },
    setChannelList(botId): Action | Function {
        return async dispatch => {
            const channelList = await BotService.getChannelConfigList(botId);
            dispatch({
                type : BotTypes.SET_CHANNEL_LIST,
                payload: channelList
            });
        };
    },
    updateChannel(channel): Action | Function {
        return async dispatch => {
            dispatch({
                type : BotTypes.UPDATE_CHANNEL,
                payload: channel
            });
        };
    },
    deleteChannel(channelId: string): Action | Function {
        return async dispatch => {
            dispatch({
                type : BotTypes.DELETE_CHANNEL,
                payload: channelId
            });
        };
    },
    addChannel(channel): Action | Function {
        return async dispatch => {
            dispatch({
                type : BotTypes.ADD_CHANNEL,
                payload: channel
            });
        };
    },
    OnResetStore(): AnyAction {
        return {
            type: BotTypes.RESET_STORE,
            payload: {}
        }
    }
}
