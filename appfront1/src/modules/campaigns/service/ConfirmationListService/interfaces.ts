import { ExtractResumeType } from '../../interfaces/send-setting';
import { ConfirmationStatus } from './constants';

export interface GetConfirmationListParams {
    startDate: string;
    endDate: string;
    scheduleCode?: string;
    status?: ConfirmationStatus;
    unitCodeList?: string[];
    doctorCodeList?: string[];
    procedureCodeList?: string[];
    specialityCodeList?: string[];
    appointmentTypeCodeList?;
    patientCode?: string;
    patientName?: string;
    type?: string;
}

export interface Confirmation {
    id: number;
    workspaceId: string;
    conversationId: string;
    integrationId: string;
    procedureName: string;
    specialityName: string;
    doctorName: string;
    appointmentTypeName: string;
    scheduleCode: string;
    scheduleDate: Date;
    patientPhone: string;
    patientEmail: string;
    patientName: string;
    patientCode: string;
    status: ConfirmationStatus;
    sendType: ExtractResumeType;

    refreshDate?: string; //usado apenas para atualizar a lista mantendo o filtro
}

export interface ConfirmationData {
    count: number;
    currentPage: number;
    nextPage: number;
    data: Confirmation[];
}

export interface GetInterfaceEntity {
    workspaceId: string;
    integrationId: string;
    queryString: string;
    errCb?: any;
}
