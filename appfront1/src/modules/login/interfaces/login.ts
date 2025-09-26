export interface LoginDto{
    email : string;
    password : string;
    token?: string;
}

export enum LoginMethod {
    bot = 'bot',
    dasa = 'dasa',
}
