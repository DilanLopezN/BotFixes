import { ActiveMessageInternalActions } from './interfaces/send-schedule-message-data.interface';
import { ExtractResumeType } from './models/extract-resume.entity';

export const transformExtractResumeTypeToActiveMessageAction = (
  extractResumeType,
) =>
  extractResumeType == ExtractResumeType.confirmation
    ? ActiveMessageInternalActions.confirmacao
    : ActiveMessageInternalActions.lembrete;
