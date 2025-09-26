import { User } from 'kissbot-core';

export interface ReduxInterface {
    loggedUser: User | undefined;
    settings: {};
    errorMessages: [];
}
