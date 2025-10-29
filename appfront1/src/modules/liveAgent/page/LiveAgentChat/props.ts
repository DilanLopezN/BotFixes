import { User } from 'kissbot-core';
import { Socket } from 'socket.io-client';
import { Team } from '../../../../model/Team';
import { Workspace } from "../../../../model/Workspace";
import { ConversationCardData } from '../../components/ConversationCard/props';
import { ChannelConfig } from "../../../../model/Bot";
import { Action } from '../../../../interfaces/ReduxAction';

export interface LiveAgentChatProps {
  loggedUser: User;
  selectedWorkspace?: Workspace;
  location?: any;
  settings: any;
  setSelectedWorkspace(workspace: Workspace): Action | Function;
}

export interface LiveAgentChatState {
  selectedConversation: ConversationCardData | undefined;
  readingMode: boolean;
  socketConnection: Socket | undefined;
  channelConfigList: ChannelConfig[];
  teams: Team[];
}
