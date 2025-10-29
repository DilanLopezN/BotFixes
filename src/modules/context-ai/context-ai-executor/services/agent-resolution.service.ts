import { Injectable } from '@nestjs/common';
import { AgentType, AgentContext, IAgent } from '../../agent/interfaces/agent.interface';
import { AgentService } from '../../agent/services/agent.service';

interface AgentResolutionParams {
    workspaceId: string;
    agentId?: string;
    preferredType?: AgentType;
    agentContext?: AgentContext;
    botId?: string;
}

@Injectable()
export class AgentResolutionService {
    constructor(private readonly agentService: AgentService) {}

    async resolveAgent(params: AgentResolutionParams): Promise<IAgent | null> {
        const { workspaceId, agentId, preferredType = AgentType.RAG, agentContext, botId } = params;

        if (agentId) {
            const agent = await this.agentService.findByWorkspaceIdAndId(agentId, workspaceId);
            if (agent?.isActive) {
                return agent;
            }
        }

        return this.agentService.getDefaultAgent(workspaceId, preferredType, botId, agentContext);
    }
}
