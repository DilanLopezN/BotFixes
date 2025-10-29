import {
    WorkspaceTypes
} from './types';
import { ReduxInterface } from './redux-interface';
import { Workspace } from '../../../model/Workspace';
import { Bot } from '../../../model/Bot';
import { AnyAction } from 'redux';

const initialState: ReduxInterface = {
    workspaceList: undefined,
    botList: [],
    selectedWorkspace: undefined,
    channelList: []
};

export const workspaceReducer = (state = initialState, action: AnyAction): ReduxInterface => {
    switch (action.type) {
        case WorkspaceTypes.SET_WORKSPACE_LIST: {
            return {
                ...state,
                workspaceList: action.payload as Workspace[],
            };
        }
        case WorkspaceTypes.SET_BOT_LIST: {
            return {
                ...state,
                botList: action.payload as Bot[],
            };
        }
        case WorkspaceTypes.SET_SELECTED_WORKSPACE: {
            return {
                ...state,
                selectedWorkspace: action.payload as Workspace,
            };
        }
        case WorkspaceTypes.SET_CHANNEL_LIST: {
            return {
                ...state,
                channelList: action.payload
            };
        }
        case WorkspaceTypes.UPDATE_CHANNEL: {
            const channels = [...state.channelList];
            const channelIndex = channels.findIndex(channel => channel._id === action.payload._id);
            channels[channelIndex] = action.payload;

            return {
                ...state,
                channelList: channels
            };
        }
        case WorkspaceTypes.DELETE_CHANNEL: {
            const channels = [...state.channelList];
            const newChannels = channels.filter(channel => channel._id !== action.payload);

            return {
                ...state,
                channelList: newChannels
            };
        }
        case WorkspaceTypes.ADD_CHANNEL: {
            const channels = [...state.channelList];
            const newChannels = [...channels, action.payload];

            return {
                ...state,
                channelList: newChannels
            };
        }
        case WorkspaceTypes.RESET_STORE: {
            state = initialState
            return state
        }
        default:
            return state;
    }
}
