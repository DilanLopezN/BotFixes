export interface ChannelSelectorProps {
    workspaceId: string;
    selectAndCreateConversation?: boolean;
    onConversationCreated?: (data: {
        type: 'success' | 'error',
        data: any,
    }) => any;
    onChannelSelected: (...params) => any;
    children?: React.ReactNode;
    invalidChannelConfigTokensToOpenConversation?: string[];
    contactPhone: string | null;
    ddi: string;
    contactId?: string;
}
