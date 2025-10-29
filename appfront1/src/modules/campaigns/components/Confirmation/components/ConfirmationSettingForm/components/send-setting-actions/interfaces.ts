import { FormikProps } from 'formik-latest';
import { Workspace } from '../../../../../../../../model/Workspace';
import { ConfirmationSettingFormDto } from '../../../../../../interfaces/confirmation-setting';
import { ExtractResumeType } from '../../../../../../interfaces/send-setting';
import React from 'react';

export interface SendSettingActionsProps {
    selectedWorkspace: Workspace;
    formik: FormikProps<ConfirmationSettingFormDto>;
    type: ExtractResumeType;
    title: string;
    children?: React.ReactNode;
}

export interface ExtractionData {
    id: string;
    name: string;
    createdAt: string;
    state: string;
}

export enum TypeOnSubmit {
    listDiagnosticExtractions = 'listDiagnosticExtractions',
    runManualExtraction = 'runManualExtraction',
    consultFlow = 'consultFlow'
}

export interface FormValues {
    date: [moment.Moment, moment.Moment];
}

export enum ConsultFlowTrigger {
    active_confirmation_confirm = 'active_confirmation_confirm',
    active_confirmation_cancel = 'active_confirmation_cancel'
}

export interface ConsultFlowFormValues {
    trigger: ConsultFlowTrigger,
    scheduleIds: string[],
}
