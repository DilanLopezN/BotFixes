import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../../ai-provider/ai.service';
import { DEFAULT_AI_MODEL } from '../enums/ai-models.enum';

export interface TransitionMessageParams {
    previousSkill: string;
    newUserMessage: string;
    hadCollectedData: boolean;
    switchReason?: string;
}

@Injectable()
export class TransitionMessageService {
    private readonly logger = new Logger(TransitionMessageService.name);

    constructor(private readonly aiProviderService: AiProviderService) {}

    async generateTransitionMessage(params: TransitionMessageParams): Promise<string | null> {
        const startTime = process.hrtime.bigint();

        try {
            const prompt = this.buildTransitionPrompt(params);

            const aiResponse = await this.aiProviderService.execute({
                prompt,
                temperature: 0.7,
                model: DEFAULT_AI_MODEL,
                maxTokens: 100,
            });

            const message = aiResponse.message || '';
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;

            this.logger.log(`[Transition Message] Generated in ${durationMs.toFixed(1)}ms: "${message}"`);

            return message.trim();
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;
            this.logger.error(`[Transition Message] Erro ao gerar mensagem (${durationMs.toFixed(1)}ms):`, error);

            // Retorna mensagem padrão em caso de erro
            return this.getFallbackTransitionMessage(params);
        }
    }

    private buildTransitionPrompt(params: TransitionMessageParams): string {
        const { previousSkill, newUserMessage, hadCollectedData, switchReason } = params;

        const dataNote = hadCollectedData
            ? 'O usuário havia fornecido algumas informações que foram salvas para uso futuro.'
            : 'O usuário ainda não havia fornecido informações completas.';

        return `
# Gerador de Mensagem de Transição para Chatbot de Saúde

Você é um assistente virtual de um hospital. O usuário estava em uma conversa sobre um assunto e MUDOU para outro assunto.

## Contexto da Transição
- **Assunto anterior**: ${previousSkill}
- **Nova solicitação do usuário**: "${newUserMessage}"
- **Dados coletados**: ${dataNote}
${switchReason ? `- **Motivo da mudança**: ${switchReason}` : ''}

## Sua Tarefa

Gere UMA ÚNICA mensagem curta (máximo 15 palavras) que:
1. Reconheça naturalmente a mudança de assunto
2. Demonstre que você está pronto para ajudar com o novo assunto
3. Seja empática e profissional
4. NÃO mencione que "detectou mudança" ou termos técnicos
5. NÃO repita o que o usuário disse

## Exemplos de Boas Mensagens

**Exemplo 1**:
- Anterior: listAppointments
- Nova: "Quais são os horários do hospital?"
- Resposta: "Entendi! Vou te ajudar com os horários."

**Exemplo 2**:
- Anterior: listDoctors
- Nova: "Preciso saber sobre convênios"
- Resposta: "Sem problemas! Sobre os convênios:"

**Exemplo 3**:
- Anterior: listAppointments (com dados)
- Nova: "O hospital aceita plano X?"
- Resposta: "Claro! Seus dados ficaram salvos. Sobre o plano X:"

**Exemplo 4**:
- Anterior: listInsurances
- Nova: "Quero falar sobre internação"
- Resposta: "Certo! Vamos falar sobre internação."

## Regras Importantes

- ❌ NÃO diga: "Entendi que você mudou de assunto"
- ❌ NÃO diga: "Vou parar o processo anterior"
- ❌ NÃO repita a pergunta do usuário
- ✅ SEJA direto e natural
- ✅ USE empatia: "Entendi", "Sem problemas", "Claro", "Certo"
- ✅ SEJA conciso: máximo 15 palavras

---

**Agora gere APENAS a mensagem de transição (sem explicações ou formatação adicional):**
`;
    }

    private getFallbackTransitionMessage(params: TransitionMessageParams): string {
        const messages = [
            'Entendi! Vou te ajudar com isso.',
            'Certo! Vamos lá.',
            'Sem problemas! Deixa eu te ajudar.',
            'Claro! Pode contar comigo.',
        ];

        // Se tinha dados coletados, adiciona nota sobre isso
        if (params.hadCollectedData) {
            const messagesWithData = [
                'Entendido! Seus dados ficaram salvos. Vamos ao seu pedido:',
                'Certo! Salvei suas informações. Sobre sua dúvida:',
                'Sem problemas! Suas informações estão guardadas. Vamos lá:',
            ];
            return messagesWithData[Math.floor(Math.random() * messagesWithData.length)];
        }

        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Prepend transition message to response content
     */
    prependTransitionMessage(transitionMessage: string, responseContent: string): string {
        if (!transitionMessage) {
            return responseContent;
        }

        // Remove pontos finais duplicados
        const transition = transitionMessage.trim().replace(/\.$/, '');
        return `${transition}\n\n${responseContent}`;
    }
}
