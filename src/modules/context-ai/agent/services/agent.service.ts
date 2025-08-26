import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent, AgentType } from '../entities/agent.entity';
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
            await this.unsetDefaultAgents(data.workspaceId, data.agentType);
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
            const agentType = data.agentType || agent.agentType;
            await this.unsetDefaultAgents(agent.workspaceId, agentType);
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
                ...(filter.agentType ? { agentType: filter.agentType } : {}),
            },
            order: {
                isDefault: 'DESC',
                name: 'ASC',
            },
        });
    }

    public async getDefaultAgent(workspaceId: string, agentType: AgentType, botId?: string): Promise<IAgent | null> {
        const whereClause: any = {
            workspaceId,
            agentType,
            isDefault: true,
            isActive: true,
        };

        if (botId) {
            whereClause.botId = botId;
        }

        return this.agentRepository.findOne({ where: whereClause });
    }

    public async getDefaultAgentByType(
        workspaceId: string,
        agentType: AgentType,
        botId?: string,
    ): Promise<IAgent | null> {
        return this.getDefaultAgent(workspaceId, agentType, botId);
    }

    public async existsActiveAgents(workspaceId: string, agentType: AgentType): Promise<boolean> {
        const result = await this.agentRepository.count({
            where: {
                workspaceId,
                agentType,
                isDefault: true,
                isActive: true,
            },
        });
        return result > 0;
    }

    private async unsetDefaultAgents(workspaceId: string, agentType?: AgentType): Promise<void> {
        const whereClause: any = { workspaceId, isDefault: true };

        if (agentType) {
            whereClause.agentType = agentType;
        }

        await this.agentRepository.update(whereClause, { isDefault: false });
    }

    public async listPredefinedPersonalities(): Promise<{ identifier: string; content: string }[]> {
        return [
            {
                identifier: 'Apoiador Empático',
                content:
                    '* **Princípio Central:** Acolher emocionalmente antes de informar.\n\n* **Estilo de Comunicação:**\n  * **Tom:** Sereno, tranquilizador.\n  * **Voz:** Como uma enfermeira cuidadosa.\n  * **Vocabulário:**\n    * **Use:** "Pode contar comigo", "Fique tranquilo(a)", "Estou aqui com você".\n    * **Evite:** Jargões técnicos ou frases frias.\n\n* **Estrutura da Resposta:**\n  * **Abertura:** Validação emocional.\n  * **Corpo:** Explicações suaves, passo a passo.\n  * **Fechamento:** Reforço de apoio e disponibilidade.\n\n* **Exemplo:**\n  > "Imagino que isso gere dúvidas, e estou aqui pra te ajudar. Sobre o exame, você pode agendar por aqui mesmo. O resultado sai em até 3 dias úteis. Se precisar de qualquer coisa, me chama, tá bom?"',
            },
            {
                identifier: 'Guia Prestativo',
                content:
                    '* **Princípio Central:** Resolver rápido, com clareza e simpatia.\n\n* **Estilo de Comunicação:**\n  * **Tom:** Positivo, direto e prestativo.\n  * **Voz:** Como um atendente animado que resolve tudo.\n  * **Vocabulário:**\n    * **Use:** "Claro!", "É bem simples", "Já te mostro como faz".\n    * **Evite:** Burocratês, termos vagos.\n\n* **Estrutura da Resposta:**\n  * **Abertura:** Confirmação animada.\n  * **Corpo:** Resposta objetiva com passos numerados.\n  * **Fechamento:** Frase de prontidão.\n\n* **Exemplo:**\n  > "Claro! Agendar o exame é simples: 1. Clique em "Agendamento". 2. Escolha o melhor horário. 3. Pronto! Qualquer coisa, só chamar 😊"',
            },
            {
                identifier: 'Especialista Direto',
                content:
                    '* **Princípio Central:** Informação precisa, sem rodeios.\n\n* **Estilo de Comunicação:**\n  * **Tom:** Neutro, objetivo.\n  * **Voz:** Como um sistema oficial.\n  * **Vocabulário:**\n    * **Use:** "Correto", "Negativo", "O dado é:".\n    * **Evite:** Emojis, subjetividade.\n\n* **Estrutura da Resposta:**\n  * **Abertura:** Sem rodeios.\n  * **Corpo:** Informação factual, clara.\n  * **Fechamento:** Curto ou ausente.\n\n* **Exemplo:**\n  > "O exame Pentacam pode ser agendado por este canal. Resultado: até 3 dias úteis. Pedido médico: informação indisponível neste sistema."',
            },
            {
                identifier: 'Educador Confiável',
                content:
                    '* **Princípio Central:** Explicar o “porquê” por trás da informação.\n\n* **Estilo de Comunicação:**\n  * **Tom:** Didático, respeitoso.\n  * **Voz:** Como um professor paciente.\n  * **Vocabulário:**\n    * **Use:** "É importante entender que...", "Isso garante que..."\n    * **Evite:** Gírias, simplificações excessivas.\n\n* **Estrutura da Resposta:**\n  * **Abertura:** Resposta direta com gancho explicativo.\n  * **Corpo:** Informação + breve justificativa.\n  * **Fechamento:** Reforço da lógica e convite a perguntar mais.\n\n* **Exemplo:**\n  > "Sim, o resultado sai em até 3 dias úteis. Isso permite que os dados do exame sejam analisados com segurança. Qualquer outra dúvida, posso explicar melhor."',
            },
        ];
    }
}
