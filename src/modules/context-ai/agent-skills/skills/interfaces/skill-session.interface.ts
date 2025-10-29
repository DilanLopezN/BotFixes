export enum SkillSessionStatus {
    // Generic statuses
    STARTED = 'started',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    // List appointments specific statuses
    WAITING_FOR_CPF = 'waiting_for_cpf',
    WAITING_FOR_BIRTH_DATE = 'waiting_for_birth_date',
    WAITING_FOR_ACTION = 'waiting_for_action',
    CONFIRMING_CANCEL = 'confirming_cancel',
    CONFIRMING_CONFIRM = 'confirming_confirm',
    CONFIRMING_RESCHEDULE = 'confirming_reschedule',
    CONFIRMING_MULTIPLE = 'confirming_multiple',
}

export enum AppointmentAction {
    CANCEL = 'cancel',
    CONFIRM = 'confirm',
    RESCHEDULE = 'reschedule',
}

export interface InitialIntent {
    action?: AppointmentAction;
    target?: string | null;
}

export interface SkillSession {
    sessionId: string;
    skillName: string;
    status: SkillSessionStatus;
    collectedData: {
        cpf?: string;
        birthDate?: string;
        patientCode?: string;
        patientName?: string;
        appointments?: unknown[];
        initialMessage?: string;
        pendingAction?: {
            action: AppointmentAction;
            indices: number[];
        };
        pendingActions?: {
            action: AppointmentAction.CANCEL | AppointmentAction.CONFIRM;
            indices: number[];
            confidence: number;
        }[];
    };
    startedAt: string;
    lastActivityAt: string;
    maxRetries: number;
    currentRetries: number;
}

export interface SkillSessionService {
    createSession(sessionId: string, skillName: string, initialStatus?: SkillSessionStatus): Promise<SkillSession>;
    getActiveSession(sessionId: string): Promise<SkillSession | null>;
    updateSession(sessionId: string, updates: Partial<SkillSession>): Promise<void>;
    clearSession(sessionId: string): Promise<void>;
    isSessionActive(sessionId: string): Promise<boolean>;
    updateCollectedData(sessionId: string, data: Partial<SkillSession['collectedData']>): Promise<void>;
}
