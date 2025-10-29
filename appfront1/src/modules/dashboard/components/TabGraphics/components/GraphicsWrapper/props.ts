import { User } from "kissbot-core";
import { Workspace } from "../../../../../../model/Workspace";
import { ConversationTemplate, TemplateGroupInterface } from "../../interfaces/conversation-template-interface";

export interface GraphicsWrapperProps {
    selectedWorkspace: Workspace;
    conversationTemplate: ConversationTemplate | undefined;
    setConversationTemplate: (value) => void;
    templateGroup: TemplateGroupInterface | undefined;
    setTemplateGroup: (value) => void;
    loggedUser: User;
    setCanAddChart: (value) => void;
}
