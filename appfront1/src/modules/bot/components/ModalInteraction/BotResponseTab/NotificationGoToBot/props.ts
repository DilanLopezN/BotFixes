import { I18nProps } from "../../../../../i18n/interface/i18n.interface";

export interface NotificationGoToBotProps extends I18nProps {
    botId: string;
    workspaceId: string;
    interactionId: string;
    children?: React.ReactNode;
}
