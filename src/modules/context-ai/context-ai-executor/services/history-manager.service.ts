import { Injectable } from '@nestjs/common';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { HistoricStorageService } from '../storage/historic-storage.service';
import { IAgent } from '../../agent/interfaces/agent.interface';
import { AiMessage } from '../../ai-provider/interfaces';
import { IContextMessage } from '../../context-message/interfaces/context-message.interface';

@Injectable()
export class HistoryManagerService {
    constructor(
        private readonly contextVariableService: ContextVariableService,
        private readonly historicStorageService: HistoricStorageService,
    ) {}

    async getHistoryMessages(params: { agent: IAgent; contextId: string; limit?: number }): Promise<AiMessage[]> {
        const { agent, contextId, limit } = params;

        const variables = await this.contextVariableService.listVariablesFromAgent({
            workspaceId: agent.workspaceId,
            agentId: agent.id,
        });

        const historicMessagesLength =
            limit || this.contextVariableService.getVariableValue(variables, 'historicMessagesLength');

        const previousMessages: IContextMessage[] = await this.historicStorageService.listContextMessages(
            contextId,
            historicMessagesLength,
        );

        return [
            ...(previousMessages || [])?.map((message) => ({
                role: message.role,
                content: message.content,
            })),
        ];
    }
}
