export interface SendTracking {
    email: string;
    external_id_client: string;
    type_tracking: TrackingType;
    identifier: string;
    amount?: number;
}

export enum TrackingType {
    metric = 'metric',
    action = 'action',
    login = 'login',
    screen = 'screen',
}

export enum CustomerXMetrics {
    QTD_aguardando_atendimento = 'QTD_aguardando_atendimento',
    QTD_avaliações_baixas = 'QTD_avaliações_baixas',
    QTD_espera_maior_uma_hora = 'QTD_espera_maior_uma_hora',
    QTD_usuarios_excedentes = 'QTD_usuarios_excedentes',
    QTD_atendimentos_excedentes = 'QTD_atendimentos_excedentes',
}
