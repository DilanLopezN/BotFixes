import { User } from "kissbot-core";
import { Team } from "../../../../model/Team";

export interface AssumeButtonProps {
    conversation: any;
    workspaceId: string;
    workspaceTeams: Team[];
    loggedUser: User;
    focusTextArea: () => void;
    forceUpdateConversation: () => void;
    onUpdatedConversationSelected: Function;
}
