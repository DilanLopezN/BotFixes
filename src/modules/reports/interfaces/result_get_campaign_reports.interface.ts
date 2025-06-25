export interface Result_getCampaignReports {
    id_lista: number;
    nome_lista: string;
    data_criacao_lista: string;
    data_envio_lista: string;
    telefone_contato: string;
    data_envio_para_contato: string;
    status_envio: 'enviado' | 'respondido' | 'lido' | 'recebido' | 'numero_invalido';
    data_status_envio: string;
    status_atendimento:
        | 'em_atendimento_com_bot'
        | 'em_atendimento'
        | 'na_fila_para_atendimento'
        | 'atendimento_finalizado';
    nome_agente_assumiu?: string;
    id_agente_assumiu?: string;
    nota_final_atendimento?: string;
    data_envio_nota_final_atendimento?: string;
}
