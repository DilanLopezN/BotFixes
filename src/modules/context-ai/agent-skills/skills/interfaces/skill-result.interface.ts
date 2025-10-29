import { ActionKey } from '../../../conversational-agents/interfaces/conversational-agent.interface';

export interface SuggestedAction {
    label: string;
    value: string;
    type?: ActionKey;
}

export interface SkillResult {
    message: string;
    isComplete: boolean;
    requiresInput?: boolean;
    appointments?: any[];
    suggestedActions?: SuggestedAction[];
}
