import { ExtractResumeType } from '../../interfaces/send-setting';

export interface ListDiagnosticExtractionsDto {
    scheduleSettingId: number;
}

export interface RunManualExtractionDto {
    extractStartDate: string ;
    extractEndDate: string;
    extractResumeType: ExtractResumeType;
    scheduleSettingId: number;
}

enum ConsultFlowTrigger {
    active_confirmation_confirm = 'active_confirmation_confirm',
    active_confirmation_cancel = 'active_confirmation_cancel'
}

export interface ConsultFlowDto {
    trigger: ConsultFlowTrigger,
    scheduleIds: string[],
    integrationId: string,
}

export interface ListExtractDataDto extends RunManualExtractionDto {}
