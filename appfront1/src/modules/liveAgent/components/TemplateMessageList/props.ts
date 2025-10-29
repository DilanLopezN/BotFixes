export interface TemplateMessageListProps {
    workspaceId: string;
    onChange: Function;
    opened: boolean;
    onClose: () => void;
    textFilter: string;
    hsmFilter: boolean;
    typeMessage?: boolean;
    channelId?: string;
    canSendOfficialTemplate: boolean;
}
