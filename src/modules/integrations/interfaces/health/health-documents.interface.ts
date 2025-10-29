import { User } from '../../../users/interfaces/user.interface';

export interface UploadDocument {
    workspaceId: string;
    file: any;
    scheduleCode: string;
    description?: string;
    appointmentTypeCode: string;
    fileTypeCode: string;
    externalId?: string;
    user: User;
    authToken: string;
}

export interface ListDocumentTypes {
    workspaceId: string;
    user: User;
    authToken: string;
}

export interface ListPatientSchedules {
    workspaceId: string;
    user: User;
    authToken: string;
}

export interface AuthenticatePatient {
    workspaceId: string;
    patientCpf: string;
    user: User;
}

export interface ListDocuments {
    workspaceId: string;
    scheduleCode: string;
    user: User;
    authToken: string;
}

export interface UploadDocumentResponse {
    ok: boolean;
    message?: string;
}

export interface CheckDocumentUploadStatus {
    workspaceId: string;
    user: User;
}
