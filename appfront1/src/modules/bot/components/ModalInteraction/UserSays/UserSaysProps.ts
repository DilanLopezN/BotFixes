import {IUserSay} from "../../../../../model/Interaction";

export interface UserSaysProps{
    userSays: IUserSay[];
    isSubmitted: boolean;
    isValidUserSays: boolean | undefined;
    onChangeInput: (userSaysAsString: Array<IUserSay>, isValid: boolean) => any;
}
