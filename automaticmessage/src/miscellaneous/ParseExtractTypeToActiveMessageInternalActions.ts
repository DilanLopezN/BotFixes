import { ActiveMessageInternalActions } from '../schedule/interfaces/send-schedule-message-data.interface';
import { ExtractResumeType } from '../schedule/models/extract-resume.entity';

export const ParseExtractTypeToActiveMessageInternalActions = {
  [ExtractResumeType.confirmation]: ActiveMessageInternalActions.confirmacao,
  [ExtractResumeType.reminder]: ActiveMessageInternalActions.lembrete,
  [ExtractResumeType.nps]: ActiveMessageInternalActions.pesquisa_satisfacao,
  [ExtractResumeType.medical_report]: ActiveMessageInternalActions.laudo_medico,
  [ExtractResumeType.schedule_notification]: ActiveMessageInternalActions.notificacao_agendamento,
  [ExtractResumeType.recover_lost_schedule]: ActiveMessageInternalActions.recuperacao_agendamento_perdido,
  [ExtractResumeType.nps_score]: ActiveMessageInternalActions.nps_avaliacao,
  [ExtractResumeType.documents_request]: ActiveMessageInternalActions.solicitacao_documentos,
  [ExtractResumeType.active_mkt]: ActiveMessageInternalActions.mkt_ativo,
};
