import { ConversationTemplate } from "../interfaces/conversation-template.interface";

export type CreateConversationTemplateDto = Omit<ConversationTemplate, 'workspaceId'>;