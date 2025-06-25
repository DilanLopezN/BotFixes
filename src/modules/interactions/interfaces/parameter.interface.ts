import { Document } from "mongoose";

export interface IParameter extends Document{
    name: string;
    type: string;
    typeId?: string;
    mandatory? : boolean;
    defaultValue? : any;
    value? : any;
}