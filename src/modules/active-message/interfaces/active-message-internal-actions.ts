//Mesmo enum do projeto automatic-message
enum ExtractResumeType {
    confirmation = 'confirmation',
    reminder = 'reminder',
    nps = 'nps', //Net Promoter Score / Pesquisa de satisfação - apenas envio do link de NPS do cliente
    medical_report = 'medical_report',
    schedule_notification = 'schedule_notification', // Notificação de que foi realizado um agendamento
    recover_lost_schedule = 'recover_lost_schedule', // Recuperação de agendamentos perdidos
    nps_score = 'nps_score', //Net Promoter Score - NPS do agendamento/atendimento
    documents_request = 'documents_request', // Solicitação de documento
    active_mkt = 'active_mkt', // Disparos dinamicos de mkt
}

// é em portugues pq tem que dar match com o trigger na interaction, e para ler lá é mais fácil em portugues
export enum ActiveMessageInternalActions {
    confirmacao = 'confirmacao',
    lembrete = 'lembrete',
    pesquisa_satisfacao = 'pesquisa_satisfacao',
    laudo_medico = 'laudo_medico',
    notificacao_agendamento = 'notificacao_agendamento',
    recuperacao_agendamento_perdido = 'recuperacao_agendamento_perdido',
    nps_avaliacao = 'nps_avaliacao',
    solicitacao_documentos = 'solicitacao_documentos',
    mkt_ativo = 'mkt_ativo',
}

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
