import { Document } from 'mongoose';
import { IPart } from './part.interface';

export enum RecognizerType {
  ai = 'ai',
  keyword = 'keyword',
}

export interface IUserSay extends Document {
    recognizer: RecognizerType;
    parts: IPart[];
}
