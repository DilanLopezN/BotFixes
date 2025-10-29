import { ProcessingResult } from './conversation-processor.interface';
import { IAgent } from '../../agent/interfaces/agent.interface';
import { DoQuestion } from './do-question.interface';

export interface BuildResponseParams {
    result: ProcessingResult;
    agent: IAgent;
    data: DoQuestion;
    contextVariables: any[];
    referenceId: string;
    debug: boolean;
}