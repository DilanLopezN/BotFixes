import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../../ai-provider/ai.service';
import { DEFAULT_AI_MODEL } from '../enums/ai-models.enum';
import {
    ContextSwitchAnalysis,
    ContextSwitchClassification,
    ContextSwitchDetectionParams,
} from '../interfaces/context-switch.interface';

@Injectable()
export class ContextSwitchDetectorService {
    private readonly logger = new Logger(ContextSwitchDetectorService.name);

    constructor(private readonly aiProviderService: AiProviderService) {}

    async detectContextSwitch(params: ContextSwitchDetectionParams): Promise<ContextSwitchAnalysis> {
        const startTime = process.hrtime.bigint();

        try {
            const prompt = this.buildContextSwitchPrompt(params);

            const aiResponse = await this.aiProviderService.execute({
                prompt,
                temperature: 0.1,
                model: DEFAULT_AI_MODEL,
                maxTokens: 200,
            });

            const response = aiResponse.message || '';
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;

            this.logger.log(
                `[Context Switch] Input: "${params.newUserMessage}" → Classification: "${response}" (${durationMs.toFixed(1)}ms)`,
            );

            const analysis = this.parseContextSwitchResponse(response);

            this.logger.log(
                `[Context Switch] Result: ${analysis.classification} (confidence: ${analysis.confidence})`,
            );

            return analysis;
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;
            this.logger.error(`[Context Switch] Erro na detecção (${durationMs.toFixed(1)}ms):`, error);

            // Em caso de erro, assume que é continuação para não quebrar o fluxo
            return {
                classification: ContextSwitchClassification.CONTINUATION,
                confidence: 0.5,
                reason: 'Erro na detecção, assumindo continuação por segurança',
                isContinuation: true,
                isContextSwitch: false,
                isClarification: false,
            };
        }
    }

    private buildContextSwitchPrompt(params: ContextSwitchDetectionParams): string {
        const { activeSkillName, activeSkillDescription, awaitingInput, newUserMessage, historicMessages } = params;

        const historyText = historicMessages?.length
            ? historicMessages
                  .slice(-3)
                  .map((msg) => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
                  .join('\n')
            : 'Sem histórico anterior';

        const awaitingInputText = this.translateAwaitingInput(awaitingInput);

        return `
# Detector de Mudança de Contexto para Chatbot de Saúde

Você é um sistema especializado em detectar se o usuário CONTINUA no mesmo contexto de uma conversa ou MUDOU de assunto.

## Contexto Atual da Conversa
- **Skill/Funcionalidade Ativa**: ${activeSkillName}
${activeSkillDescription ? `- **Descrição**: ${activeSkillDescription}` : ''}
- **Sistema está aguardando**: ${awaitingInputText}

## Histórico Recente da Conversa
${historyText}

## Nova Mensagem do Usuário
"${newUserMessage}"

---

## Sua Tarefa

Classifique a nova mensagem do usuário em uma das categorias abaixo:

### 1. CONTINUATION (Continuação)
**Quando usar**: O usuário está respondendo diretamente o que foi pedido ou dando seguimento natural ao contexto atual.

**Exemplos**:
- Sistema pede CPF → Usuário: "123.456.789-00"
- Sistema pede data → Usuário: "15/03/1990"
- Sistema pede confirmação → Usuário: "sim", "ok", "confirmo"
- Sistema aguarda escolha → Usuário escolhe uma opção
- Agente pergunta "quer contar mais?" → Usuário: "não" (resposta válida à pergunta)

**Confidence**: 0.8 - 1.0

---

### 2. CONTEXT_SWITCH (Mudança de Contexto)
**Quando usar**: O usuário MUDOU COMPLETAMENTE de assunto, ignorando o que estava sendo discutido.

**Exemplos**:
- Sistema aguarda CPF → Usuário: "Quais são os horários de funcionamento?"
- Sistema aguarda data → Usuário: "Quero saber sobre convênios"
- No meio de listar consultas → Usuário: "O hospital aceita plano X?"
- Sistema pede confirmação → Usuário muda totalmente: "Preciso falar sobre internação"

**Confidence**: 0.8 - 1.0

**IMPORTANTE**: Detectar mudança de assunto é CRÍTICO para evitar frustração do usuário!

---

### 3. CLARIFICATION (Pedindo Esclarecimento)
**Quando usar**: O usuário está pedindo ajuda, esclarecimento ou detalhes sobre o que foi pedido, MAS ainda está no contexto.

**Exemplos**:
- Sistema pede CPF → Usuário: "Como assim CPF?", "Qual formato?", "Precisa ser só números?"
- Sistema pede data → Usuário: "Qual data?", "Minha data de nascimento?", "Como devo informar?"
- Sistema pede escolha → Usuário: "Quais são as opções?", "Não entendi"
- Usuário demonstra confusão: "Hã?", "O que?", "Não compreendi"

**Confidence**: 0.6 - 0.9

---

### 4. AMBIGUOUS (Ambíguo)
**Quando usar**: Não está claro se é continuação, mudança ou esclarecimento.

**Exemplos**:
- Mensagens muito curtas: "sim", "não", "talvez" (sem contexto claro)
- Mensagens que podem ter múltiplas interpretações
- Conteúdo confuso ou contraditório

**Confidence**: 0.0 - 0.5

---

## Regras Importantes

1. **Priorize detectar CONTEXT_SWITCH**: É melhor detectar mudança quando há dúvida do que forçar continuação
2. **Palavras-chave de mudança**: "quero", "preciso", "gostaria", "me diga sobre", "como faço para" geralmente indicam nova intenção
3. **Comandos de cancelamento**: "parar", "cancelar", "sair", "esquece" = CONTEXT_SWITCH
4. **Negações que indicam mudança**: "não quero mais", "mudei de ideia", "não quero fazer isso", "não me interessa" = CONTEXT_SWITCH
5. **Negações simples como resposta**: Um simples "não" respondendo a uma pergunta opcional do agente = CONTINUATION (ex: "quer contar mais?" → "não")
6. **Perguntas sobre outro assunto**: Qualquer pergunta sobre tópico diferente = CONTEXT_SWITCH

---

## Formato de Resposta

Retorne APENAS um JSON válido com a seguinte estrutura:

{
    "classification": "CONTINUATION" | "CONTEXT_SWITCH" | "CLARIFICATION" | "AMBIGUOUS",
    "confidence": 0.0-1.0,
    "reason": "Explicação curta (máximo 50 palavras) do porquê dessa classificação"
}

**Exemplos de resposta**:

1. Sistema aguarda CPF, usuário: "111.222.333-44"
{
    "classification": "CONTINUATION",
    "confidence": 0.95,
    "reason": "Usuário forneceu CPF no formato esperado, respondendo diretamente ao solicitado"
}

2. Sistema aguarda CPF, usuário: "Quero saber sobre convênios"
{
    "classification": "CONTEXT_SWITCH",
    "confidence": 0.98,
    "reason": "Usuário mudou completamente de assunto, perguntando sobre convênios em vez de fornecer CPF"
}

3. Sistema aguarda data, usuário: "Qual formato devo usar?"
{
    "classification": "CLARIFICATION",
    "confidence": 0.85,
    "reason": "Usuário está pedindo esclarecimento sobre como informar a data, ainda no contexto"
}

4. Agente de ouvidoria pergunta "Se desejar, pode me contar mais?", usuário: "não"
{
    "classification": "CONTINUATION",
    "confidence": 0.90,
    "reason": "Usuário respondeu à pergunta opcional do agente com uma negação simples, indicando que não deseja complementar. É uma resposta válida dentro do contexto."
}

---

**Agora analise a nova mensagem do usuário e retorne o JSON:**
`;
    }

    private translateAwaitingInput(status: string): string {
        const translations: Record<string, string> = {
            waiting_for_cpf: 'CPF do paciente',
            waiting_for_birth_date: 'Data de nascimento do paciente',
            waiting_for_confirmation: 'Confirmação do usuário',
            waiting_for_selection: 'Seleção de uma opção pelo usuário',
            waiting_for_appointment_choice: 'Escolha de um horário de consulta',
            waiting_for_doctor_choice: 'Escolha de um médico',
            completed: 'Nenhuma informação (processo concluído)',
            cancelled: 'Nenhuma informação (processo cancelado)',
        };

        return translations[status] || status;
    }

    private parseContextSwitchResponse(response: string): ContextSwitchAnalysis {
        try {
            const cleanResponse = response.trim();

            if (!cleanResponse || cleanResponse === 'null') {
                return this.createDefaultAnalysis();
            }

            const parsed = JSON.parse(cleanResponse);

            if (!parsed || typeof parsed !== 'object' || !parsed.classification) {
                return this.createDefaultAnalysis();
            }

            const classification =
                (parsed.classification as ContextSwitchClassification) || ContextSwitchClassification.AMBIGUOUS;
            const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
            const reason = parsed.reason || 'Sem razão fornecida';

            return {
                classification,
                confidence,
                reason,
                isContinuation: classification === ContextSwitchClassification.CONTINUATION,
                isContextSwitch: classification === ContextSwitchClassification.CONTEXT_SWITCH,
                isClarification: classification === ContextSwitchClassification.CLARIFICATION,
            };
        } catch (error) {
            this.logger.error('[Context Switch] Erro ao parsear resposta:', error);
            return this.createDefaultAnalysis();
        }
    }

    private createDefaultAnalysis(): ContextSwitchAnalysis {
        return {
            classification: ContextSwitchClassification.CONTINUATION,
            confidence: 0.5,
            reason: 'Não foi possível classificar, assumindo continuação',
            isContinuation: true,
            isContextSwitch: false,
            isClarification: false,
        };
    }
}
