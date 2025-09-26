import { ImageTypeSelected } from "../modalIntegration";

export interface CardAppointmentProps {
    appointment: any;
    addNotification: (args: any) => void;
    attachmentId: string;
    conversationId: string;
    cropping: boolean;
    imageTypeSelected: ImageTypeSelected;
    workspaceId: string;
}
