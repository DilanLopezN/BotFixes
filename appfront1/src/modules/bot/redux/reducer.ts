import {
  BotTypes
} from './types';
import { fieldSearchType, ReduxInterface } from './redux-interface';
import { Bot } from '../../../model/Bot';
import { Interaction } from '../../../model/Interaction';
import { BotAttribute } from '../../../model/BotAttribute';
import { AnyAction } from 'redux';

const initialState: ReduxInterface = {
  currentBot: undefined,
  channelList: [],
  currentChannel: undefined,
  interactionList: [],
  selectedLanguage: "pt-BR" as any,
  currentInteraction: undefined,
  unchangedInteraction: undefined,
  modalInteractionSubmitted: false,
  botAttributes: [],
  botList: [],
  interactionSearch: {value: '', field: fieldSearchType.name},
  validateInteraction: undefined,
  currentExecutingInteraction: [],
};

export const botReducer = (state = initialState, action: AnyAction): ReduxInterface => {
  switch (action.type) {
    case BotTypes.SET_CURRENT_BOT: {
      return <ReduxInterface>{
        ...state,
        currentBot: <Bot>action.payload,
      };
    }
    case BotTypes.SET_INTERACTION_LIST: {
      return <ReduxInterface>{
        ...state,
        interactionList: <Array<Interaction>>action.payload,
      };
    }
    case BotTypes.SET_SELECTED_LANGUAGE: {
      return <ReduxInterface>{
        ...state,
        selectedLanguage: action.payload
      };
    }
    case BotTypes.SET_CURRENT_INTERACTION: {
      return <ReduxInterface>{
        ...state,
        currentInteraction: <Interaction>action.payload
      };
    }
    case BotTypes.SET_UNCHANGED_INTERACTION: {
      return <ReduxInterface>{
        ...state,
        unchangedInteraction: <Interaction>action.payload
      };
    }
    case BotTypes.SET_VALIDATE_INTERACTION: {
      return <ReduxInterface>{
        ...state,
        validateInteraction: <Interaction>action.payload
      };
    }
    case BotTypes.SET_MODAL_SUBMITTED: {
      return <ReduxInterface>{
        ...state,
        modalInteractionSubmitted: <boolean>action.payload
      };
    }
    case BotTypes.SET_BOT_ATTRIBUTES: {
      const newOptions: Array<BotAttribute> = [];

      action.payload.forEach((element: BotAttribute, index) => {
        if (newOptions.find((el: any) => el.name === element.name)) {
          return
        }
        newOptions.push(element)
      });

      return <ReduxInterface>{
        ...state,
        botAttributes: <Array<BotAttribute>>newOptions
      };
    }
    case BotTypes.SET_BOT_LIST: {
      return <ReduxInterface>{
        ...state,
        botList: <Array<Bot>>action.payload
      };
    }
    case BotTypes.SET_CURRENT_EXECUTING_INTERACTION: {
      return <ReduxInterface>{
        ...state,
        currentExecutingInteraction: action.payload
      };
    }
    case BotTypes.SET_CURRENT_CHANNEL: {
      return <ReduxInterface>{
        ...state,
        currentChannel: action.payload
      };
    }
    case BotTypes.SEARCH_INTERACTION: {
      return <ReduxInterface>{
        ...state,
        interactionSearch: action.payload
      };
    }
    case BotTypes.SET_CHANNEL_LIST: {
      return <ReduxInterface>{
        ...state,
        channelList: action.payload
      };
    }
    case BotTypes.UPDATE_CHANNEL: {
      const channels = [...state.channelList];
      const channelIndex = channels.findIndex(channel => channel._id === action.payload._id);
      if(channelIndex === -1){
        channels.push(action.payload)
      }else {
        channels[channelIndex] = action.payload;
      }

      return <ReduxInterface>{
        ...state,
        channelList: channels
      };
    }
    case BotTypes.DELETE_CHANNEL: {
      const channels = [...state.channelList];
      const newChannels = channels.filter(channel => channel._id !== action.payload);

      return <ReduxInterface>{
        ...state,
        channelList: newChannels
      };
    }
    case BotTypes.ADD_CHANNEL: {
      const channels = [...state.channelList];
      const newChannels = [...channels, action.payload];

      return <ReduxInterface>{
          ...state,
          channelList: newChannels
      };
  }
  case BotTypes.RESET_STORE: {
    state = initialState
    return state
}
    default:
      return state;
  }
}
