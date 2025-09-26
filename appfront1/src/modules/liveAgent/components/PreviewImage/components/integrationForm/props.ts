export interface IntegrationFormProps {
    onAuthenticated: () => void;
    addNotification: (args: any) => void;
    workspaceId: string;
}
