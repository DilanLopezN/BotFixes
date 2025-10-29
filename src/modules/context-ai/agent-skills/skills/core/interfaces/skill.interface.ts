import { SkillEnum } from '../../implementations';
import { IAgent } from '../../../../agent/interfaces/agent.interface';

export interface SkillExamples {
    positive: string[];
    negative: string[];
}

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface Skill {
    name: SkillEnum;
    description: string;
    examples: SkillExamples;
    execute(agent: IAgent, args?: Record<string, any>): Promise<unknown>;
    generatePrompt?(data: unknown, userMessage: string, conversationHistory?: ConversationMessage[]): string;
}
