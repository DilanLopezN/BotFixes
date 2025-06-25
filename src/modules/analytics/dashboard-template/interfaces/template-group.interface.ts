import { Document } from "mongoose";

export interface TemplateGroup extends Document {
    workspaceId: string;
    name: string;
    ownerId: string;
    shared: boolean;
    globalEditable: boolean;
}