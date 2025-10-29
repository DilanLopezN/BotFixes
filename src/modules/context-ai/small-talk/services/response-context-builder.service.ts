import { Injectable } from '@nestjs/common';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { IAgent } from '../../agent/interfaces/agent.interface';
import { ResponseContext } from '../interfaces/response-context.interface';
import { DoQuestionParameters } from '../../context-ai-executor/interfaces/do-question.interface';

@Injectable()
export class ResponseContextBuilderService {
    constructor(private readonly contextVariableService: ContextVariableService) {}

    async build(agent: IAgent, customVariables?: DoQuestionParameters): Promise<ResponseContext> {
        const variables = await this.contextVariableService.listVariablesFromAgent({
            workspaceId: agent.workspaceId,
            agentId: agent.id,
        });

        const context: ResponseContext = {
            botName: '',
            clientName: '',
            patientName: '',
        };

        variables.forEach((variable) => {
            if (variable.name === 'botName') {
                context.botName = variable.value || '';
            }
            if (variable.name === 'clientName') {
                context.clientName = variable.value || '';
            }
        });

        if (customVariables?.paciente_nome) {
            context.patientName = customVariables.paciente_nome;
        }

        return context;
    }
}
