import { CreateConversationTemplateDto } from "./create-conversation-template.dto";

export interface CreateConversationTemplateBatchDto {
    templates: CreateConversationTemplateDto[]
}