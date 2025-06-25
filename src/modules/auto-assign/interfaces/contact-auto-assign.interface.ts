export interface ContactAutoAssign {
    id: number;
    workspaceId: string;
    name: string;
    phone: string;
    autoAssignConversationIds: number[];
    contactId?: string;
}

export interface UpdateContactAutoAssign {
    name: string;
    autoAssignConversationIds: number[];
    contactId?: string;
}

export interface CreateContactAutoAssign extends Omit<ContactAutoAssign, 'id'> {}
