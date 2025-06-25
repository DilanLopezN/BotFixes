export interface ResultCreateMultipleConversation {
    countCreatedConversation: number;
    conversationOpened: { phone: string; conversation: string }[];
    contactsBlocked: string[];
}
