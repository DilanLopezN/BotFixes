import { UpdateTemplateGroupInterface } from "../interfaces/update-template-group.interface";

export class UpdateTemplateGroupDto implements Omit<UpdateTemplateGroupInterface, 'id'> {
    name: string;
    shared: boolean;
    globalEditable: boolean;
}