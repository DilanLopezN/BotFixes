import { IAgent } from '../../agent/interfaces/agent.interface';
import { AiMessage } from '../../ai-provider/interfaces';
import { DoQuestionParameters } from './do-question.interface';

interface BuildMessageTemplate {
    workspaceId: string;
    question: string;
    context: string;
    agent: IAgent;
    parameters?: DoQuestionParameters;
    historicMessages: AiMessage[];
}

export type { BuildMessageTemplate };
