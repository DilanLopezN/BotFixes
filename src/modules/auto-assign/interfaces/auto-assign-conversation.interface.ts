import { ContactAutoAssign } from '../models/contact-auto-assign.entity';

export interface AutoAssignConversation {
    id: number;
    name: string;
    teamId: string;
    channelConfigIds: string[];
    workspaceId: string;
    enableRating: boolean;
    deletedAt?: Date;
}

export interface UpdateAutoAssignConversation {
    name: string;
    teamId: string;
    channelConfigIds: string[];
    enableRating: boolean;
    contacts?: Partial<ContactAutoAssign>[];
}

export interface CreateAutoAssignConversation extends Omit<AutoAssignConversation, 'id'> {
    contacts?: Partial<ContactAutoAssign>[];
}
