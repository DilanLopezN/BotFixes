export interface AutoAssignConversation {
    id?: number;
    name: string;
    teamId: string;
    channelConfigIds: string[];
    enableRating?:boolean;
    workspaceId: string;
    deletedAt?: Date;
    contacts: Partial<ContactAutoAssign>[];
}

export interface UpdateAutoAssignConversation
    extends Pick<AutoAssignConversation, 'contacts' | 'teamId' | 'channelConfigIds' | 'name'> {
    id: number;
}

export interface ContactAutoAssign {
    id?: number;
    workspaceId: string;
    name: string;
    phone: string;
    autoAssignConversationId?: number;
    contactId?: string;
}

export interface CreateAutoAssignConversation extends Omit<AutoAssignConversation, 'id'> {
    contacts: Partial<ContactAutoAssign>[];
}
