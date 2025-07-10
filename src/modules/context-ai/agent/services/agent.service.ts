import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import {
    CreateAgentData,
    DeleteAgentData,
    IAgent,
    ListAgentsFilter,
    UpdateAgentData,
} from '../interfaces/agent.interface';
import { CONTEXT_AI } from '../../ormconfig';

@Injectable()
export class AgentService {
    constructor(
        @InjectRepository(Agent, CONTEXT_AI)
        private readonly agentRepository: Repository<Agent>,
    ) {}

    public async create(data: CreateAgentData): Promise<IAgent> {
        if (data.isDefault) {
            await this.unsetDefaultAgents(data.workspaceId);
        }

        const agent = this.agentRepository.create(data);
        return this.agentRepository.save(agent);
    }

    public async update(data: UpdateAgentData): Promise<IAgent> {
        const agent = await this.agentRepository.findOne({ where: { id: data.agentId } });

        if (!agent) {
            throw new NotFoundException(`Agent with ID ${data.agentId} not found`);
        }

        if (data.isDefault) {
            await this.unsetDefaultAgents(agent.workspaceId);
        }

        Object.assign(agent, data);

        return this.agentRepository.save(agent);
    }

    public async delete(data: DeleteAgentData): Promise<{ ok: boolean }> {
        const result = await this.agentRepository.delete(data.agentId);

        if (!result.affected) {
            throw new NotFoundException(`Agent with ID ${data.agentId} not found`);
        }

        return { ok: !!result.affected };
    }

    public async findById(agentId: string): Promise<IAgent | null> {
        return this.agentRepository.findOne({ where: { id: agentId } });
    }

    public async findByWorkspaceIdAndId(agentId: string, workspaceId: string): Promise<IAgent | null> {
        return this.agentRepository.findOne({ where: { id: agentId, workspaceId } });
    }

    public async list(filter: ListAgentsFilter): Promise<IAgent[]> {
        return this.agentRepository.find({
            where: {
                workspaceId: filter.workspaceId,
                isActive: filter.isActive !== undefined ? filter.isActive : true,
                ...(filter.botId ? { botId: filter.botId } : {}),
            },
            order: {
                isDefault: 'DESC',
                name: 'ASC',
            },
        });
    }

    public async getDefaultAgent(workspaceId: string, botId?: string): Promise<IAgent | null> {
        const whereClause: any = {
            workspaceId,
            isDefault: true,
            isActive: true,
        };

        if (botId) {
            whereClause.botId = botId;
        }

        return this.agentRepository.findOne({ where: whereClause });
    }

    public async existsActiveAgents(workspaceId: string, botId?: string): Promise<boolean> {
        const whereClause: any = {
            workspaceId,
            isDefault: true,
            isActive: true,
        };

        if (botId) {
            whereClause.botId = botId;
        }

        const result = await this.agentRepository.count({ where: whereClause });
        return result > 0;
    }

    private async unsetDefaultAgents(workspaceId: string): Promise<void> {
        await this.agentRepository.update({ workspaceId, isDefault: true }, { isDefault: false });
    }

    public async listPredefinedPersonalities(): Promise<{ identifier: string; content: string }[]> {
        return [
            {
                identifier: 'Calmo e Tranquilo',
                content:
                    "**Tom:** Respostas calmas, suaves e acolhedoras.\n- **Use:** 'Tudo bem', 'Sem problema', 'Vamos ver juntos'.\n- **Formato:** Comece validando a dúvida e responda de forma direta, mas acolhedora, mostrando que está disponível.\n*Exemplo:* 'Tudo bem! Nosso atendimento é das 8h às 18h, mas se precisar de algo fora desse horário, me fala, tá?'",
            },
            {
                identifier: 'Prático e Direto',
                content:
                    "**Tom:** Objetivo e rápido, sem formalidade.\n- **Use:** Contrações como 'pra', 'tá', 'sai por'.\n- **Formato:** Resposta curta, clara, mas não fria: mostre que tá ali pra ajudar.\n*Exemplo:* 'Atendemos das 8h às 18h, tá? Qualquer coisa é só chamar.'",
            },
            {
                identifier: 'Amigável e Leve',
                content:
                    "**Tom:** Conversa de quem quer ajudar, de forma leve e simpática.\n- **Use:** 'Claro!', 'Imagina!', 'Pode deixar'. Emojis simples 😊.\n- **Formato:** Resposta positiva, próxima e aberta a continuar.\n*Exemplo:* 'Claro! Atendemos das 8h às 18h 😊 Se quiser, posso te ajudar a marcar um horário!'",
            },
            {
                identifier: 'Informal e Gente Como a Gente',
                content:
                    "**Tom:** Bem cotidiano, como papo de Whats.\n- **Use:** 'Opa', 'Beleza', 'Show'.\n- **Formato:** Resposta curta, simples, mas sempre convidando a seguir a conversa.\n*Exemplo:* 'Opa! A gente atende das 8h às 18h. Se quiser saber mais, só dar um toque 😉'",
            },
        ];
    }
}
