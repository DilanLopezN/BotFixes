import { InteractionType, IResponse } from './response.interface';
import { IUserSay } from './userSay.interface';

export interface ILanguageInteraction {
    language: string;
    responses?: IResponse[];
    userSays?: IUserSay[];
    intents?: string[];
}
