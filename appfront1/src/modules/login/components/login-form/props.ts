import { LoginMethod } from "../../interfaces/login";

export interface LoginFormProps {
    loginErrorMessage: string;
    onSubmit: (form: any, loginMethod: LoginMethod, requireCognitoRegistry: boolean) => void;
    onUserDontExists: () => void;
}
