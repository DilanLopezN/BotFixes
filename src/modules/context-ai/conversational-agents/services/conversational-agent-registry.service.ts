import { Injectable, Logger } from '@nestjs/common';
import { ConversationalAgent } from '../interfaces/conversational-agent.interface';
import { InternmentAgent } from '../agents/internment.agent';
import { ComplaintAgent } from '../agents/complaint.agent';
import { JobApplicationAgent } from '../agents/job-application.agent';
import { OpenIaProviderService } from '../../ai-provider/providers/openai-provider.service';

@Injectable()
export class ConversationalAgentRegistry {
    private readonly logger = new Logger(ConversationalAgentRegistry.name);
    private readonly agents = new Map<string, ConversationalAgent>();

    constructor(
        private readonly internmentAgent: InternmentAgent,
        private readonly complaintAgent: ComplaintAgent,
        private readonly jobApplicationAgent: JobApplicationAgent,
        private readonly openAiProvider: OpenIaProviderService,
    ) {
        this.registerAgent(this.internmentAgent);
        this.registerAgent(this.complaintAgent);
        this.registerAgent(this.jobApplicationAgent);
    }

    registerAgent(agent: ConversationalAgent): void {
        if (!this.agents.has(agent.id)) {
            this.agents.set(agent.id, agent);
        }
    }

    getAgentById(agentId: string): ConversationalAgent | undefined {
        return this.agents.get(agentId);
    }

    async findBestAgent(message: string): Promise<ConversationalAgent | null> {
        try {
            const agentDescriptions = Array.from(this.agents.values()).map((agent) => ({
                id: agent.id,
                name: agent.name,
                description: agent.description,
            }));

            if (agentDescriptions.length === 0) {
                return null;
            }

            const systemPrompt = `
Você é um classificador de intenções para um hospital. Sua tarefa é analisar a mensagem do usuário e determinar qual agente conversacional especializado deve lidar com ela.

Agentes disponíveis:
${agentDescriptions.map((a) => `- ${a.id}: ${a.name} - ${a.description}`).join('\n')}

Regras:
1. Retorne APENAS o ID do agente mais apropriado
2. Se nenhum agente for apropriado, retorne "NONE"
3. Considere o contexto e intenção da mensagem, não apenas palavras-chave
4. Seja preciso: só ative um agente se a mensagem realmente estiver relacionada ao seu propósito

Exemplos:
Mensagem: "quero internar minha mãe"
Resposta: internment

Mensagem: "preciso fazer uma reclamação"
Resposta: complaint

Mensagem: "como faço para trabalhar aí?"
Resposta: job_application

Mensagem: "quero enviar meu currículo"
Resposta: job_application

Mensagem: "vocês têm vagas abertas?"
Resposta: job_application

Mensagem: "qual é o horário de funcionamento?"
Resposta: NONE`;

            const result = await this.openAiProvider.execute({
                messages: [],
                prompt: systemPrompt + '\n\nMensagem do usuário: ' + message,
                temperature: 0.1,
                maxTokens: 10,
            });

            const selectedAgentId = result?.message?.trim()?.toLowerCase();
            return this.agents.get(selectedAgentId) || null;
        } catch (error) {
            this.logger.error(`[AgentRegistry] Error finding best agent with LLM:`, error);
            return null;
        }
    }
}
