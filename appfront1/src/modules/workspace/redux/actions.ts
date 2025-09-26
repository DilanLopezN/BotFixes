import { Constants } from './../../../utils/Constants';
import { Action } from '../../../interfaces/ReduxAction';
import { WorkspaceTypes } from './types';
import { WorkspaceService } from '../services/WorkspaceService';
import { Workspace } from '../../../model/Workspace';
import { PaginatedModel } from '../../../model/PaginatedModel';
import { ChannelConfigService } from '../../newChannelConfig/service/ChannelConfigService';
import { AnyAction } from 'redux';
import { Bot } from '../../../model/Bot';

export const WorkspaceActions = {
    setWorkspaceList: (): Action | Function => {
        return async (dispatch: any) => {
            const response: PaginatedModel<Workspace> = await WorkspaceService.getWorkspaceList();
            const workspaceList: Array<Workspace> = response?.data;
            dispatch({
                type: WorkspaceTypes.SET_WORKSPACE_LIST,
                payload: workspaceList,
            });
        };
    },
    setWorkspaceListNotAsync: (workspaceList: Workspace[]): Action => {
        return {
            type: WorkspaceTypes.SET_WORKSPACE_LIST,
            payload: workspaceList,
        };
    },
    setBotList: (workspaceId): Action | Function => {
        return async (dispatch: any) => {
            try {
                const botList = await WorkspaceService.getWorkspaceBots(workspaceId);
                if (botList && botList.data) {
                    dispatch({
                        type: WorkspaceTypes.SET_BOT_LIST,
                        payload: botList.data,
                    });
                }
            } catch (error) {
                console.error('Error fetching bot list:', error);
            }
        };
    },

    setSelectedWorkspace: (workspace: Workspace): Action | Function => {
        localStorage.setItem(Constants.LOCAL_STORAGE_MAP.CURRENT_WORKSPACE, workspace._id);

        return async (dispatch: any) => {
            dispatch({
                type: WorkspaceTypes.SET_SELECTED_WORKSPACE,
                payload: workspace,
            });
        };
    },
    setSelectedWorkspaceWithoutLoaders: (workspace: Workspace, botList?: Bot[]): Action | Function => {
        localStorage.setItem(Constants.LOCAL_STORAGE_MAP.CURRENT_WORKSPACE, workspace._id);
        return (dispatch: any) => {
            if (botList) {
                dispatch({
                    type: WorkspaceTypes.SET_BOT_LIST,
                    payload: botList && botList.length ? botList : [],
                });
            }

            dispatch({
                type: WorkspaceTypes.SET_SELECTED_WORKSPACE,
                payload: workspace,
            });
        };
    },
    setChannelList(workspaceId): Action | Function {
        return async (dispatch) => {
            const channelList = await ChannelConfigService.getChannelConfigList(workspaceId);
            dispatch({
                type: WorkspaceTypes.SET_CHANNEL_LIST,
                payload: channelList,
            });
        };
    },
    updateChannel(channel): Action | Function {
        return async (dispatch) => {
            dispatch({
                type: WorkspaceTypes.UPDATE_CHANNEL,
                payload: channel,
            });
        };
    },
    deleteChannel(channelId: string): Action | Function {
        return async (dispatch) => {
            dispatch({
                type: WorkspaceTypes.DELETE_CHANNEL,
                payload: channelId,
            });
        };
    },
    addChannel(channel): Action | Function {
        return async (dispatch) => {
            dispatch({
                type: WorkspaceTypes.ADD_CHANNEL,
                payload: channel,
            });
        };
    },
    OnResetStore(): AnyAction {
        return {
            type: WorkspaceTypes.RESET_STORE,
            payload: {},
        };
    },
};
