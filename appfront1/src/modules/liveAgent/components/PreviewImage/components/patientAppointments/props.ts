import { ImageTypeSelected, IntegrationPatient } from "../modalIntegration";

export interface PatientAppointmentsProps {
    patient: IntegrationPatient | undefined;
    addNotification: (args: any) => void;
    attachmentId: string;
    conversationId: string;
    cropping: boolean;
    imageTypeSelected: ImageTypeSelected;
    workspaceId: string;
}
