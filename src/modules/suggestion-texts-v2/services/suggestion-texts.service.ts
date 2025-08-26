import { BadRequestException, Injectable } from '@nestjs/common';
import { ExternalDataService } from './external-data.service';
import {
    AgentSuggestionTextParams,
    SuggestionMessageType,
    TemplateSuggestionTextParams,
} from '../interfaces/suggestion-texts.interface';
import { Repository } from 'typeorm';
import { SuggestionTexts } from '../models/suggestion-texts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SUGGESTION_TEXTS_CONNECTION } from '../ormconfig';
import { DefaultResponse } from '../../../common/interfaces/default';
import { COMPLETION_MODEL_COST, PROMPT_MODEL_COST } from '../../context-ai/defaults';

@Injectable()
export class SuggestionTextsService {
    constructor(
        @InjectRepository(SuggestionTexts, SUGGESTION_TEXTS_CONNECTION)
        private suggestionTextsRepository: Repository<SuggestionTexts>,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async getAgentMessageSuggestions(
        workspaceId: string,
        data: AgentSuggestionTextParams,
    ): Promise<DefaultResponse<{ suggestions: string[] }>> {
        if (!data.message || data?.message?.length < 20) {
            throw new BadRequestException('Message must have at least 20 characters');
        }

        if (!data.message || data?.message?.length > 1024) {
            throw new BadRequestException('Message must have at most 1024 characters');
        }

        const formattedMessage = `Mensagem original: \`\`\`
${data.message}
\`\`\``;

        const template = `
            Você é um assistente de texto e ajuda atendentes de um callcenter a responder pacientes da melhor forma possível.

            Regras:
            - Se a mensagem for inadequada, ofensiva ou de cunho sexual, me retorne um array vazio.
            - Responda em português do Brasil.
            - Mantenha **EXATAMENTE** a mesma estrutura e formatação da mensagem original, incluindo quebras de linha, espaçamentos e emojis. NÃO remova nenhuma quebra de linha ou espaçamento.
            - Para a mensagem do atendente recebida, retorne **DUAS MENSAGENS**, em formato de array de strings válidas em JSON.
            - A primeira deve conter a mensagem corrigida para o português do Brasil.
            - A segunda deve conter uma refatoração, mas sem alterar o sentido.
            - **Preserve toda a formatação e quebras de linha da mensagem original, não altere nada.**

            **Mensagem original:**
            ${formattedMessage}
        `;

        // const model = 'gpt-3.5-turbo';
        const model = 'gpt-4o-mini';
        const messageOptions = {
            prompt: null,
            message: template,
            model,
            maxTokens: data.message.length * 3,
            temperature: 0.5,
        };

        const aiResponse = await this.externalDataService.sendMessageToAi(messageOptions);
        let suggestions = [];

        try {
            for (const choice of aiResponse.response.choices) {
                let content = choice.message.content.trim();
                const parsedContent = JSON.parse(content);

                if (Array.isArray(parsedContent)) {
                    suggestions = parsedContent;
                }
            }
        } catch (error) {
            console.log('Error on parsing suggestions', error);
        }

        const promptTokensCost = (aiResponse.promptTokens / 1_000_000) * PROMPT_MODEL_COST;
        const completionTokensCost = (aiResponse.completionTokens / 1_000_000) * COMPLETION_MODEL_COST;

        const agentMessageSuggestion = this.suggestionTextsRepository.create({
            prompt: template,
            completion: JSON.stringify(suggestions),
            workspaceId,
            promptTokens: aiResponse.promptTokens,
            completionTokens: aiResponse.completionTokens,
            createdAt: Date.now(),
            type: SuggestionMessageType.agent,
            model,
            cost: promptTokensCost + completionTokensCost,
        });

        await this.suggestionTextsRepository.save(agentMessageSuggestion);
        return {
            data: { suggestions },
        };
    }

    async getTemplateMessageSuggestions(
        workspaceId: string,
        data: TemplateSuggestionTextParams,
    ): Promise<DefaultResponse<{ messages: Record<string, any>[]; suggestions: string[]; remove: string[] }>> {
        if (!data.message || data?.message?.length < 20) {
            throw new BadRequestException('Message must have at least 20 characters');
        }

        if (!data.message || data?.message?.length > 1024) {
            throw new BadRequestException('Message must have at most 1024 characters');
        }

        const prompt = `
            ### **PROMPT FINAL CONSOLIDADO**

            Você é um especialista em conformidade de mensagens da Plataforma WhatsApp Business, treinado para analisar e reescrever modelos de mensagens para garantir total conformidade com as políticas de mensagens de **UTILIDADE**.

            #### **OBJETIVO GERAL**

            Seu objetivo é duplo:

            1.  **Analisar Internamente:** Use o PROCESSO DE RACIOCÍNIO detalhado abaixo para classificar a mensagem de entrada como UTILITY ou MARKETING. Essa análise interna guiará sua resposta final.
            2.  **Gerar Sugestões:** Com base na sua classificação, construa uma resposta JSON detalhada que identifique problemas, sugira melhorias e forneça duas versões da mensagem totalmente compatíveis com a categoria de UTILITY.

            **IMPORTANTE:** Sua resposta deve ser sempre em **português do Brasil** e explicar todos os pontos em termos simples, acessíveis para usuários que não são especialistas em marketing ou nas políticas da Meta.

            -----

            #### **FORMATO DE ENTRADA**

            A entrada será um único objeto JSON representando a mensagem a ser analisada.

            {
                "id": "o id da mensagem",
                "message": "o texto da mensagem",
                "buttons": []
            }

            -----

            #### **PROCESSO DE RACIOCÍNIO INTERNO (NÃO DEVE APARECER NA SAÍDA)**

            Para cada mensagem, siga **exatamente** esta ordem de verificação para determinar a classificação.

            * **1. Verificação de Conteúdo Misto:**

                * **Pergunta:** A mensagem combina um elemento de utilidade claro (ex: status de pedido) com um elemento de marketing explícito (ex: cupom de desconto)?
                * **Se SIM:** A classificação é **MARKETING**. A justificativa é "Mensagem mista (utilidade + marketing explícito)". Pare aqui e prossiga para gerar a resposta.

            * **2. Teste de Marketing Direto:**

                * **Pergunta:** O objetivo principal é vender, promover ou iniciar um contato comercial genérico?
                    * **A) Oferta ou Venda Explícita:** Contém promoção, desconto, cupom ou convite direto para comprar.
                    * **B) Início de Conversa Genérico:** Uma saudação para iniciar uma conversa sem um contexto transacional específico já iniciado pelo cliente (ex: "Podemos conversar?").
                * **Se SIM (para A ou B):** A classificação é **MARKETING**. A justificativa deve indicar qual item foi encontrado (ex: "Contém uma oferta explícita (2A)"). Pare aqui e prossiga para gerar a resposta.

            * **3. Teste de Utilidade Contextual:**

                * **Pergunta:** A mensagem se encaixa em um destes contextos de utilidade?
                    * **A) Acompanhamento de Ação Específica:** Confirmação, atualização ou lembrete de uma transação ou solicitação **já em andamento**.
                    * **B) Informação Crítica:** Alerta de segurança, fraude ou informação essencial.
                    * **C) Acompanhamento Pós-Interação:** Follow-up sobre uma **interação recente**, como uma tentativa de reagendamento após uma chamada perdida, uma oferta de cuidado pós-atendimento ou um pedido de feedback.
                * **Se SIM (para A, B ou C):** A classificação é **UTILITY**. A justificativa deve indicar o item (ex: "Acompanhamento pós-interação para reagendamento (3C)").

            * **4. Classificação Padrão:**

                * **Se a mensagem não se encaixou em nenhuma regra anterior:** A classificação final é **MARKETING** por padrão. A justificativa é: "Não é Marketing direto nem se encaixa em um contexto de Utilidade claro."

            -----

            #### **REGRAS DE REESCRITA E FORMATAÇÃO**

            Ao gerar as versões de utilidade, siga estas regras:

            * **Remova estritamente:**
                * Palavras promocionais: promoção, desconto, oferta, últimas vagas, não perca, exclusivo, grátis (exceto em contexto de cuidado pós-atendimento), imperdível, só hoje, incrível.
                * CTAs (Chamadas para Ação) de vendas: clique aqui, aproveite, compre agora, corra.
                * Tom de urgência ou excessivamente comercial.
                * Se a mensagem original tiver mais de 3 emojis, aponte a necessidade de removê-los.
            * **Adicione quando relevante:**
                * Referências a uma ação do cliente: "Conforme sua solicitação...", "Em relação ao seu pedido...".
                * Contexto transacional: "Protocolo de atendimento nº 12345", "Pedido nº ABC123".
                * Tom neutro e profissional.
            * **Estrutura da Mensagem:**
                * O template deve terminar com texto, não com botões.
                * O texto de cada botão deve ter no máximo 20 caracteres.
                * A mensagem deve ter no máximo 3 botões.
                * Não adicione exemplos variáveis (como {{1}}) nas mensagens reescritas.
                * Converta links de texto em botões do tipo URL no formato: { "type": "URL", "text": "Texto do botão", "url": "https://..." }.

            -----

            #### **FORMATO DE SAÍDA FINAL (JSON)**

            Sua saída deve ser um único objeto JSON válido, baseado no resultado da sua análise interna.

            * **Se a classificação interna for MARKETING:** Preencha todos os campos com a análise e as novas versões.
            * **Se a classificação interna for UTILITY:** O campo "remove" deve ser um array vazio. O campo "suggestions" deve explicar por que a mensagem já é de utilidade (citando a regra do processo de raciocínio). O campo "messages" pode conter a mensagem original (ou com pequenas melhorias) como "Versão 1" e uma versão mais formalizada como "Versão 2".
            
            #### OBS 
            - Não utilize referencias das regras utilizadas internamente.

            {
                "remove": [
                    "Liste aqui os elementos que tornam a mensagem não compatível com 'Utilidade', explicando o motivo de forma simples e citando a regra do processo de raciocínio que foi violada. Se não houver nada a remover, retorne um array vazio."
                ],
                "suggestions": [
                    "Dê sugestões práticas sobre como alinhar a intenção da mensagem à política de 'Utilidade'. Se a mensagem já for compatível, explique aqui o porquê."
                ],
                "messages": [
                    {
                    "message": "Versão 1 (Edição Leve): Reescreva a mensagem removendo os elementos de marketing, mas mantendo o tom e a estrutura próximos ao original.",
                    "buttons": [{ "type": "QUICK_REPLY", "text": "Botão Sugerido 1" }]
                    },
                    {
                    "message": "Versão 2 (Reformulada): Reescreva a mensagem de forma mais significativa para garantir 100% de conformidade, usando um tom mais neutro e adicionando contexto transacional, se aplicável.",
                    "buttons": [{ "type": "URL", "text": "Botão Sugerido 2", "url": "https://..." }]
                    }
                ]
            }

            ## ORIGINAL MESSAGE INPUT
            ${JSON.stringify(data)}
            `;

        const model = 'gpt-4.1-mini';
        const messageOptions = {
            prompt: null,
            message: prompt,
            model,
            temperature: 0.7,
            resultsLength: 1,
        };

        try {
            const aiResponse = await this.externalDataService.sendMessageToAi(messageOptions);
            let aiMessageContent = aiResponse.response?.choices?.[0]?.message.content;

            if (aiMessageContent.includes('```')) {
                aiMessageContent = aiMessageContent
                    .replace(/^```json\s*/i, '')
                    .replace(/^```\s*/, '')
                    .replace(/\s*```$/, '')
                    .trim();
            }
            const { messages, suggestions, remove } = JSON.parse(aiMessageContent);

            const promptTokensCost = (aiResponse.promptTokens / 1_000_000) * PROMPT_MODEL_COST;
            const completionTokensCost = (aiResponse.completionTokens / 1_000_000) * COMPLETION_MODEL_COST;

            const templateMessageSuggestion = this.suggestionTextsRepository.create({
                workspaceId,
                prompt,
                completion: aiMessageContent,
                promptTokens: aiResponse.promptTokens,
                completionTokens: aiResponse.completionTokens,
                type: SuggestionMessageType.template,
                model,
                cost: promptTokensCost + completionTokensCost,
            });

            await this.suggestionTextsRepository.save(templateMessageSuggestion);
            return {
                data: { messages, suggestions, remove },
            };
        } catch (err) {
            console.error(err);
        }
    }
}
