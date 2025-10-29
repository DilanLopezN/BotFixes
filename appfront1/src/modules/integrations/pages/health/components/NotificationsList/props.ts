export interface NotificationProps {
    _id: string;
    message: string;
    type: string;
    createdAt: number;
}

export interface NotificationsListProps {
    increment: number;
    setIncrement: React.Dispatch<React.SetStateAction<number>>;
    messageId: string;
    integrationId: string;
    workspaceId: string;
    setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
    Close: () => any;
    getTranslation: (string) => any;
}
