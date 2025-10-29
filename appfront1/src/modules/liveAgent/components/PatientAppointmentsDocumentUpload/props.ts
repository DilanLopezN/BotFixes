export interface PatientAppointmentsDocumentUploadProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientCode: string;
    conversationId: string;
}