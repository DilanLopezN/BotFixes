import { Document } from "mongoose";

export interface Comment extends Document{
    comment: string;
    userId: string;
    createdAt?: string;
}