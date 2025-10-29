import { Injectable } from '@nestjs/common';
import { REWRITE_PROMPT_TEMPLATE } from '../configs/rewrite-prompt.config';

interface ClarificationState {
    question: string;
}

@Injectable()
export class RewritePromptBuilder {
    build(question: string, clarificationState: ClarificationState | null): string {
        let prompt = REWRITE_PROMPT_TEMPLATE;

        const pendingClarificationContext = clarificationState
            ? this.buildClarificationContext(clarificationState, question)
            : '';

        const clarificationPriority = clarificationState ? this.buildClarificationPriority() : '';

        prompt = prompt.replace('{{CLARIFICATION_CONTEXT}}', pendingClarificationContext);
        prompt = prompt.replace('{{CLARIFICATION_PRIORITY}}', clarificationPriority);
        prompt = prompt.replace('{{QUESTION}}', question);

        return prompt;
    }

    private buildClarificationContext(clarificationState: ClarificationState, question: string): string {
        return `
<ContextoDeClarificacaoPendente>
IMPORTANTE: Você fez a seguinte pergunta de esclarecimento ao usuário:
"${clarificationState.question}"

A resposta atual do usuário  pode ser uma resposta a essa clarificação:
("${question}")

<InstrucoesEspeciais>
Instruções para processar respostas a clarificações:

1. **Detectar se é resposta à clarificação:**
   - **ATENÇÃO**: Se a Pergunta Atual contém uma **nova pergunta completa** ou menciona um **referente explícito DIFERENTE** das opções da clarificação, NÃO é resposta à clarificação.

   - Exemplos de **NOVA PERGUNTA** (NÃO é resposta à clarificação):
     * Clarificação: "Qual valor você quer saber? Da consulta com o Dr. Mauricio ou da ressonância magnética?"
     * Usuário: "e quais convenios atende a marcela?" NÃO é resposta (menciona marcela, não Mauricio nem ressonância)
     * Ação: Processar como NOVA PERGUNTA (seguir regras padrão)

   - Exemplos de **RESPOSTA À CLARIFICAÇÃO** (é resposta):
     * Clarificação: "Qual valor você quer saber? Da consulta com o Dr. Mauricio ou da ressonância magnética?"
     * Usuário: "da ressonancia magnetica" ou "da ressonância" ou "ressonância" É resposta
     * Ação: REWRITE para "Qual o valor da ressonância magnética?"

   - Exemplo com nome parcial do médico:
     * Clarificação: "Qual valor você quer saber? Da consulta com o Dr. Carlos Silva ou da ressonância magnética de cabeça?"
     * Usuário: "carlos" ou "silva" ou "dr carlos" ou "do carlos" É resposta (menciona o médico)
     * Ação: REWRITE para "Qual o valor da consulta com o Dr. Carlos Silva?"

   - Exemplo de resposta genérica "da consulta":
     * Clarificação: "Você quer saber o valor da consulta com o Dr. João ou do exame de sangue?"
     * Usuário: "da consulta" ou "da consulta médica" É resposta (menciona "consulta" que estava na clarificação)
     * Ação: REWRITE para "Qual o valor da consulta com o Dr. João?"

   - Outro exemplo:
     * Clarificação: "Você quer saber o horário da consulta com a Dra. Laura ou do ecocardiograma?"
     * Usuário: "da consulta" ou "consulta" ou "dra laura" ou "laura" É resposta
     * Ação: REWRITE para "Qual o horário da consulta com a Dra. Laura?"

   - **IMPORTANTE**: Respostas podem mencionar apenas parte do nome (primeiro ou último nome do médico, parte do procedimento)
     * Se a clarificação menciona "Dr. Carlos Silva" e usuário diz "carlos" ou "silva", é resposta válida
     * Se a clarificação menciona "ressonância magnética" e usuário diz "ressonância", é resposta válida
     * Sempre faça matching parcial de nomes e termos!

2. **Como reescrever respostas a clarificações:**
   - Identifique qual opção da clarificação o usuário escolheu
   - **VALIDE** se a resposta menciona uma das opções apresentadas
   - Se mencionar algo DIFERENTE, é uma NOVA PERGUNTA (prossiga para regras padrão)
   - Reconstrua a pergunta COMPLETA usando:
     * O contexto da clarificação (ex: "qual o valor", "quando")
     * A opção escolhida pelo usuário
   - NÃO apenas copie a resposta do usuário
   - NÃO peça nova clarificação se já temos a resposta

3. **Quando NÃO é resposta à clarificação:**
   - Se a Pergunta Atual for completamente diferente do assunto da clarificação
   - Se mencionar referentes que NÃO estavam nas opções da clarificação
   - Se for uma nova pergunta não relacionada
   - Se contiver palavras interrogativas (quais, quando, quanto, onde, etc.) sobre um assunto diferente
   - Nestes casos, **LIMPE O CONTEXTO DE CLARIFICAÇÃO** e processe normalmente seguindo as regras padrão abaixo
</InstrucoesEspeciais>
</ContextoDeClarificacaoPendente>
`;
    }

    private buildClarificationPriority(): string {
        return `
**PRIORIDADE MÁXIMA**: Há uma clarificação pendente acima. Antes de aplicar qualquer regra abaixo, PRIMEIRO verifique se a Pergunta Atual é uma resposta à clarificação pendente:

**COMO IDENTIFICAR RESPOSTA À CLARIFICAÇÃO:**
- Se a resposta mencionar QUALQUER PARTE de uma das opções da clarificação (nome parcial, sobrenome, palavra-chave), é uma resposta válida
- Respostas que começam com "da/do/dos/das" seguido de algo mencionado na clarificação são SEMPRE respostas válidas
  * "da consulta" → se clarificação menciona "consulta", é resposta
  * "da consulta médica" → se clarificação menciona "consulta médica" ou "consulta", é resposta
  * "do exame" → se clarificação menciona "exame", é resposta
  * "da ressonância" → se clarificação menciona "ressonância", é resposta

**O QUE FAZER:**
- Reescreva para a pergunta completa usando a opção escolhida
- Use "decision": "REWRITE", NÃO "CLARIFY" novamente
- NUNCA gere uma nova clarificação quando há clarificação pendente e usuário respondeu

**QUANDO NÃO É RESPOSTA:**
- Se a resposta menciona algo completamente DIFERENTE do que estava na clarificação
- Se for uma nova pergunta completa sobre outro assunto
- Nestes casos, prossiga com as regras normais abaixo
`;
    }
}
