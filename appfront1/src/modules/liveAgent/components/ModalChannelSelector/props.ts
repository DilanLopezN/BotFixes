import { ChannelConfig } from "../../../../model/Bot";
import { Team } from "../../../../model/Team";

export interface ModalChannelSelectorProps {
    isOpened: boolean;
    workspaceId: string;
    onClose: Function;
    selectAndCreateConversation?: boolean;
    invalidChannelConfigTokensToOpenConversation?: string[];
    contactPhone: string | null;
    ddi: string;
    contactId?: string;
    onConversationCreated?: (data: {
        type: 'success' | 'error',
        data: any,
    }) => any;
    onConversationDataChange: (data: {channelConfig: ChannelConfig, team: Team}) => any
}
