import { User } from "kissbot-core";
import { Socket } from 'socket.io-client';

export interface ConversationListAlertProps {
    socketConnection: Socket;
    workspaceId?: string;
    loggedUser: User;
}
