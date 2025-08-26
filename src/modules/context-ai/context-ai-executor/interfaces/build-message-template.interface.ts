import { IAgent } from '../../agent/interfaces/agent.interface';
import { DoQuestionParameters } from './do-question.interface';

interface BuildMessageTemplate {
    question: string;
    context: string;
    agent: IAgent;
    parameters?: DoQuestionParameters;
}

export type { BuildMessageTemplate };
