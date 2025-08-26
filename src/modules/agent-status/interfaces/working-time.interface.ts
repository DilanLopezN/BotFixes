export enum WorkingTimeType {
    ONLINE = 'online',
    BREAK = 'break',
    INACTIVE = 'inative',
}

export interface WorkingTimeData {
    workspaceId: string;
    userId: string;
    type: WorkingTimeType;
    startedAt: number;
    endedAt?: number;
    durationInSeconds?: number;
    breakOvertimeSeconds?: number;
    justification?: string;
    breakSettingId?: number;
    breakChangedByUserId?: string; // Caso um admin insira o registro vai salvar o ID do usuario
    breakChangedByUserName?: string; // Caso um admin insira o registro vai salvar o Nome do usuario
    contextDurationSeconds?: number; // Contexto da duração da pausa quando foi setado, para caso ela mude saber qual era o valor quando iniciou
    contextMaxInactiveDurationSeconds?: number; // Contexto da duração maxima da pausa quando foi setado, para caso ela mude saber qual era o valor quando iniciou
}

export interface WorkingTimeFilter {
    workspaceId: string;
    userId?: string;
    startDate?: number;
    endDate?: number;
    type?: WorkingTimeType;
    breakSettingId?: number;
    active?: boolean;
}
