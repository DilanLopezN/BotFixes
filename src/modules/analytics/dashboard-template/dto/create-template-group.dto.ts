import { CreateTemplateGroupInterface } from "../interfaces/create-template-group.interface";

export class CreateTemplateGroupDto implements Omit<CreateTemplateGroupInterface, 'workspaceId'> {
    name: string;
    ownerId: string;
    shared: boolean;
    globalEditable: boolean;
}