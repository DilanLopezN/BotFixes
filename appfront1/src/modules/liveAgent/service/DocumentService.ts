import { apiInstance } from '../../../utils/Http';

export interface DocumentType {
    code: string;
    description: string;
}

export interface DocumentStatusResponse {
    ok: boolean;
    message: string;
    enabled?: boolean;
    code?: string;
}

export interface DocumentUploadData {
    file: File;
    scheduleCode: string;
    description: string;
    appointmentTypeCode: string;
    fileTypeCode: string;
    externalId?: string;
}

export interface Document {
    id: string;
    originalName: string;
    fileTypeCode: string;
    createdAt: string;
    extension: string;
    url: string;
    externalId?: string;
}

export interface ListDocumentsRequest {
    scheduleCode?: string;
}

class DocumentService {
    static async checkDocumentStatus(workspaceId: string): Promise<DocumentStatusResponse> {
        const response = await apiInstance.get(`/workspaces/${workspaceId}/integrations-documents/getStatus`);
        return response.data;
    }

    static async authenticatePatient(workspaceId: string, patientCpf: string): Promise<string> {
        const response = await apiInstance.post(
            `/workspaces/${workspaceId}/integrations-documents/authenticatePatient`,
            {
                patientCpf: patientCpf,
            }
        );
        return response.data;
    }

    static async listDocumentTypes(workspaceId: string, authToken?: string): Promise<DocumentType[]> {
        const headers = authToken ? { 'X-Patient-Auth': authToken } : {};
        const response = await apiInstance.post(`/workspaces/${workspaceId}/integrations-documents/listDocumentTypes`, {}, {
            headers
        });
        return response.data;
    }

    static async uploadDocument(workspaceId: string, data: DocumentUploadData, authToken?: string): Promise<{ ok: boolean }> {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('scheduleCode', data.scheduleCode);
        formData.append('description', data.description);
        formData.append('appointmentTypeCode', data.appointmentTypeCode);
        formData.append('fileTypeCode', data.fileTypeCode);
        
        if (data.externalId) {
            formData.append('externalId', data.externalId);
        }

        const headers: any = {
            'Content-Type': 'multipart/form-data',
        };
        
        if (authToken) {
            headers['X-Patient-Auth'] = authToken;
        }

        const response = await apiInstance.post(`/workspaces/${workspaceId}/integrations-documents/upload`, formData, {
            headers,
        });
        return response.data;
    }

    static async listDocuments(workspaceId: string, data: ListDocumentsRequest, authToken?: string): Promise<Document[]> {
        const headers = authToken ? { 'X-Patient-Auth': authToken } : {};
        const response = await apiInstance.post(
            `/workspaces/${workspaceId}/integrations-documents/listDocuments`,
            data,
            { headers }
        );
        return response.data;
    }
}

class AppointmentService {
    static async getPatientAppointments(workspaceId: string, authToken: string): Promise<any[]> {
        const headers = { 'X-Patient-Auth': authToken };
        const response = await apiInstance.post(
            `/workspaces/${workspaceId}/integrations-documents/listPatientSchedules`,
            {},
            { headers }
        );
        return response.data || [];
    }
}

export { DocumentService, AppointmentService };
