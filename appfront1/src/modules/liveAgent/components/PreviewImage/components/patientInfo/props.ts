import { IntegrationPatient } from '../modalIntegration';

export interface PatientInfoProps {
    patient: IntegrationPatient | undefined;
    onPatientFetched: (patient: IntegrationPatient) => void;
    attributes: any[];
    resetPatient: () => void;
    patientToken: string | undefined;
    onPatientTokenFetched: (token: string) => void;
    authenticated: boolean;
    addNotification: (args: any) => void;
    workspaceId: string;
}
