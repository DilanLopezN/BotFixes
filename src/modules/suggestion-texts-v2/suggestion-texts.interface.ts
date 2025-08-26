export interface MessageSuggestion {
    message: string;
    confidance: number;
}

export interface MessageSuggestionResponse {
    suggestions: MessageSuggestion[];
}
