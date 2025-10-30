export interface GotoReference {
    type: 'BOT_INTERACTION';
    location: string;
    details: {
        interactionId: string;
        interactionName: string;
        responseType: string;
        language: string;
    };
}

export interface DeleteInteractionError {
    error: 'INTERACTION_HAS_GOTO_REFERENCES';
    message: string;
    references: GotoReference[];
}
