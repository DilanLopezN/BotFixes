export interface ChangeInitialPasswordFormProps {
    onChange: (newPassword: string) => void;
    onLogout: () => void;
    loginErrorMessage: string;
}
