import { User } from "kissbot-core";
import { TemplateMessage } from "../TemplateMessageList/interface";

export interface ReplaceTemplateVariablesModalProps { 
    template: TemplateMessage;
    onClose: () => void;
    onCancel: () => void;
    onChange: (replacedText: string, paramsVariable?: string[]) => void;
    loggedUser: User;
    conversation: any;
}