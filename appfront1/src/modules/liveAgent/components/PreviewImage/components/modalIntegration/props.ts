import { ConversationCardData } from "../../../ConversationCard/props";

export interface ModalIntegrationProps {
    conversation: ConversationCardData;
    addNotification: (args: any) => void;
    attachmentId: string;
    cropping: boolean;
    workspaceId: string;
}
