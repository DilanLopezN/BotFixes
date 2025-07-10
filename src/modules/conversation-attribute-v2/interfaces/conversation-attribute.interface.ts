export interface Attribute {
    name: string;
    value: any;
    label: string;
    type: string;
}

export interface ConversationAttribute {
    id?: string;
    workspaceId: string;
    conversationId: string;
    data: Attribute[];
}
