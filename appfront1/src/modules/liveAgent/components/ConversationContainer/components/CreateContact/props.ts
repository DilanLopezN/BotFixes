import { Socket } from 'socket.io-client';

export interface CreateContactProps {
    onClose: () => void;
    notification: Function;
    workspaceId: string;
    onContactInfo: () => void;
    onContactSelected: (contactId: string) => void;
    socketConnection: Socket;
}
