import { User } from 'kissbot-core';
import { LoginMethod } from '../modules/login/interfaces/login';

interface IUser {
    loginMethod?: LoginMethod;
}

const isSSOUser = (user: User & IUser): boolean => {
    return !!user?.cognitoUniqueId && user.loginMethod !== LoginMethod.bot;
};

export { isSSOUser };
