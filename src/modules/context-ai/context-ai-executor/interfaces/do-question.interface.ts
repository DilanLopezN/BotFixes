export interface DoQuestion {
    contextId: string;
    question: string;
    useHistoricMessages: boolean;
    fromInteractionId?: string;
    botId?: string;
}
