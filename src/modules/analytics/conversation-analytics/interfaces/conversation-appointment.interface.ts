export interface ConversationAppointmentResult {
    // Campos básicos da conversa
    iid: string;
    telefone_paciente: string;
    cpf_paciente: string;
    data_criacao_atendimento: string;
    data_finalizacao_atendimento: string;
    time_id: string;
    nome_time: string;
    nome_agente: string;
    canal: string;
    etiquetas: string[];
    status_conversa: string;
    url_conversa: string;

    // Campos do appointment quando includeAppointmentDetails = true
    codigo_agendamento?: string;
    data_agendamento?: string;
    status_agendamento?: string;
    tipo_agendamento?: string;
    quantidade_datas_disponiveis?: number;
    escolheu_medico?: boolean;
    nome_medico?: string;
    primeira_data_disponivel?: string;
    categoria_convenio?: string;
    nome_convenio?: string;
    plano_convenio?: string;
    sub_plano_convenio?: string;
    data_ultimo_agendamento_paciente?: string;
    data_proximo_agendamento_paciente?: string;
    area_profissional?: string;
    localizacao_unidade?: string;
    nome_unidade?: string;
    idade_paciente?: number;
    codigo_paciente?: string;
    periodo_dia?: string;
    nome_procedimento?: string;
    nome_motivo?: string;
    texto_motivo?: string;
    nome_especialidade?: string;
    etapa?: string;
    tipo_servico?: string;
}
