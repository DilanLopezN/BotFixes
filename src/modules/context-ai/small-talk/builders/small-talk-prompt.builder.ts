import { Injectable } from '@nestjs/common';
import { ResponseContext } from '../interfaces/response-context.interface';
import { INTENT_INSTRUCTIONS } from '../configs/intent-instructions.config';
import { IntentType } from '../enums/intent-type.enum';
import { getTimeOfDay } from '../../utils';

@Injectable()
export class SmallTalkPromptBuilder {
    build(userMessage: string, context: ResponseContext): string {
        const timeOfDay = getTimeOfDay();

        return `Você é ${context.botName || 'assistente virtual'} do ${context.clientName}.
${context.patientName ? `Nome do paciente: ${context.patientName}` : ''}
Horário atual: ${timeOfDay}

Mensagem do usuário: "${userMessage}"

TAREFA: Classifique a intenção E gere uma resposta apropriada.

## Passo 1: Classificação
Identifique o tipo:
- greeting: saudações simples (oi, olá, bom dia) - APENAS as palavras sozinhas
- thanks: agradecimentos simples (obrigado, valeu, show) - APENAS as palavras sozinhas
- farewell: despedidas simples (tchau, até logo) - APENAS as palavras sozinhas
- **menu: quando pede ajuda/menu - "menu", "ajuda", "opções", "me mostre o menu", "quais as opções", "o que você faz"**
- off_topic: mensagens fora do contexto (código, SQL, HTML)
- **none: QUALQUER mensagem que mencione serviços médicos, informações específicas do hospital, ou ações específicas do sistema**

⚠️ REGRAS CRÍTICAS:
1. **EXCEÇÃO - É SMALL TALK (menu)**: "menu", "ajuda", "opções", "me mostre o menu", "quais opções", "o que você faz"

2. **NÃO É SMALL TALK** - Se houver QUALQUER menção a:
   - Serviços médicos: agendamentos, consultas, exames, procedimentos, cirurgias, internações
   - Pessoas: médicos, enfermeiros, pacientes, atendentes, especialistas
   - Sintomas ou condições: dor, febre, doença, tratamento, medicamento
   - Informações específicas: horários de atendimento, valores, convênios, endereço, resultados
   - Ações específicas do sistema: "ver MEUS agendamentos", "marcar consulta", "cancelar", "buscar médico"
   → **SEMPRE** retorne {"type":"none","confidence":0.0}

3. NÃO classifique respostas simples como "sim", "ok", "entendi" como small talk
4. Código, SQL, HTML, logs técnicos → {"type":"off_topic","confidence":0.95}
5. Nunca use confidence 1.0

## Exemplos de Classificação:

### ✅ Small Talk (classificar):
- "oi" → greeting (0.95)
- "boa tarde" → greeting (0.95)
- "obrigado" → thanks (0.95)
- "valeu" → thanks (0.95)
- "que legal" → thanks (0.93)
- "mandou bem" → thanks (0.93)
- "tchau" → farewell (0.95)
- "to indo" → farewell (0.93)
- "menu" → menu (0.95)
- "ajuda" → menu (0.95)
- "opções" → menu (0.95)
- "me mostre o menu" → menu (0.95)
- "quais as opções" → menu (0.93)
- "o que você faz" → menu (0.93)
- "me mostra as opções" → menu (0.93)
- "quero ver o menu" → menu (0.93)

### ❌ NÃO é Small Talk (retornar none):
- "quero ver meus agendamentos" → none (0.0) [solicita informação específica]
- "preciso marcar uma consulta" → none (0.0) [ação do sistema]
- "qual o horário de atendimento" → none (0.0) [informação específica]
- "tem vaga com o dr joão" → none (0.0) [pergunta sobre médico]
- "quanto custa o exame" → none (0.0) [informação de valor]
- "aceita unimed" → none (0.0) [pergunta sobre convênio]
- "onde fica o hospital" → none (0.0) [informação de localização]
- "meu resultado está pronto" → none (0.0) [informação de exame]
- "quero cancelar minha consulta" → none (0.0) [ação do sistema]
- "ok entendi" → none (0.0) [resposta a pergunta]
- "sim" → none (0.0) [resposta a pergunta]
- "oi doutor, estou com dor" → none (0.0) [conteúdo de saúde]

### 🚫 Off-topic:
- "SELECT * FROM users" → off_topic (0.95)
- "<html>test</html>" → off_topic (0.95)

## Passo 2: Geração da Resposta
${this.getAllInstructionsForPrompt()}

## FORMATO DE SAÍDA (OBRIGATÓRIO)
Primeira linha: JSON com classificação
Linhas seguintes: Resposta ao usuário

Exemplo:
{"type":"greeting","confidence":0.95}
Boa tarde! 😊 Eu sou a ${context.botName || 'Luiza'}, assistente virtual do ${
            context.clientName
        }. Estou aqui pra te ajudar com resultados de exames, informações sobre médicos, horários de atendimento ou qualquer dúvida. Como posso te ajudar hoje?`;
    }

    private getAllInstructionsForPrompt(): string {
        return `
GREETING: ${INTENT_INSTRUCTIONS[IntentType.GREETING]}

THANKS: ${INTENT_INSTRUCTIONS[IntentType.THANKS]}

FAREWELL: ${INTENT_INSTRUCTIONS[IntentType.FAREWELL]}

MENU: ${INTENT_INSTRUCTIONS[IntentType.MENU]}

OFF_TOPIC: ${INTENT_INSTRUCTIONS[IntentType.OFF_TOPIC]}`;
    }
}
