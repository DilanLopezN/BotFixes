enum SuggestionTone {
    formal = 'formal',
    casual = 'casual',
    persuasive = 'persuasive',
    authoritative = 'authoritative',
    empathetic = 'empathetic',
    concise = 'concise',
    gentle = 'gentle',
    motivational = 'motivational',
    humorous = 'humorous',
    sales_oriented = 'sales_oriented',
    argumentative = 'argumentative',
    explanatory = 'explanatory',
    marketing = 'marketing',
}

enum SuggestionMessageType {
    agent = 'agent',
    template = 'template',
    templateInsight = 'templateInsight',
}

enum TemplateSuggestionType {
    suggestion = 'suggestion',
    marketing = 'marketing',
}

interface AgentSuggestionTextParams {
    message: string;
    suggestionTone?: SuggestionTone;
}

interface TemplateSuggestionTextParams {
    message: string;
}

export type { AgentSuggestionTextParams, TemplateSuggestionTextParams };
export { SuggestionMessageType, SuggestionTone, TemplateSuggestionType };
