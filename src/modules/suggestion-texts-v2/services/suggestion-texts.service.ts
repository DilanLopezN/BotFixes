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

    private getMarketingAndUtilityExamples() {
        return `
Exemplo de template de marketing:
---
Você sabia? Agora você pode fazer o checkout em nosso aplicativo. Baixe aqui para conferir nossa experiência simplificada
Somente no aplicativo: 20% de desconto esta semana! Use o código SUMMER20 para economizar em estilos selecionados. Para baixar nosso aplicativo, clique aqui.
---
Você sabia? Instalamos uma nova torre na sua região para você aproveitar uma experiência de rede otimizada. Para saber mais, acesse nosso site.
---
Sentimos sua falta! Junte-se a nós para curtir uma tarde ou noite de diversão com sua família. Clique aqui para fazer a reserva a uma taxa especial
---
À medida que nos aproximamos do final do ano, refletimos sobre o que nos motiva: você. Agradecemos por você ser um cliente valioso. Esperamos continuar atendendo às suas necessidades

----------------------

Exemplo de template de utilidade:
---
Olá. Vejo que você solicitou suporte por meio do nosso bate-papo online. Sou o assistente virtual do WhatsApp. Posso ajudar você?
---
Recentemente, você conversou conosco online sobre o pedido. Como foi sua experiência? Clique aqui para responder a uma breve pesquisa:
---
Um item do seu pedido está aguardando estoque. Entraremos em contato novamente com uma data estimada de envio. Se você quiser cancelar o pedido e receber um reembolso, clique aqui:`;
    }

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
            message: data.message,
            suggestions,
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
    ): Promise<DefaultResponse<{ suggestions: string[] }>> {
        if (!data.message || data?.message?.length < 20) {
            throw new BadRequestException('Message must have at least 20 characters');
        }

        if (!data.message || data?.message?.length > 2048) {
            throw new BadRequestException('Message must have at most 1024 characters');
        }

        const marketingAndUtilityExamples = this.getMarketingAndUtilityExamples();
        const formattedMessage = `Mensagem original: \`\`\`
${data.message}
\`\`\``;

        let template: string = `
Você é um assistente de texto e ajuda a remover a intenção de marketing do sentido de um texto.

A mensagem abaixo foi enviada para aprovação do wahtsapp e foi categorizada como marketing.
Preciso que você transforme em uma mensagem de utilidade, reescrevendo todo o texto e removendo palavras chaves que induzam a 
fazer com que seja categorizado como marketing.

Regras:
- Se a mensagem for inadequada, ofensiva ou de cunho sexual, me retorne um array vazio.
- Responda em português do Brasil.
- **Preserve toda a formatação e quebras de linha da mensagem original, não altere nada.**

${marketingAndUtilityExamples}

**Mensagem original:**
${formattedMessage}
                `;

        const model = 'gpt-4o-mini';
        const messageOptions = {
            prompt: null,
            message: template,
            model,
            maxTokens: data.message.length * 3,
            temperature: 0.7,
            resultsLength: 1,
        };

        const aiResponse = await this.externalDataService.sendMessageToAi(messageOptions);
        let suggestions: string[] = [];

        for (const choice of aiResponse?.response?.choices || []) {
            suggestions.push(choice.message.content.trim());
        }

        const promptTokensCost = (aiResponse.promptTokens / 1_000_000) * PROMPT_MODEL_COST;
        const completionTokensCost = (aiResponse.completionTokens / 1_000_000) * COMPLETION_MODEL_COST;

        const templateMessageSuggestion = this.suggestionTextsRepository.create({
            message: data.message,
            suggestions,
            workspaceId,
            promptTokens: aiResponse.promptTokens,
            completionTokens: aiResponse.completionTokens,
            createdAt: Date.now(),
            type: SuggestionMessageType.template,
            model,
            cost: promptTokensCost + completionTokensCost,
        });

        await this.suggestionTextsRepository.save(templateMessageSuggestion);
        return {
            data: { suggestions },
        };
    }

    async getTemplateMessageMarketingInsights(
        workspaceId: string,
        data: TemplateSuggestionTextParams,
    ): Promise<DefaultResponse<{ insight: string }>> {
        if (!data.message || data?.message?.length < 20) {
            throw new BadRequestException('Message must have at least 20 characters');
        }

        if (!data.message || data?.message?.length > 2048) {
            throw new BadRequestException('Message must have at most 2048 characters');
        }

        const marketingAndUtilityExamples = this.getMarketingAndUtilityExamples();
        const formattedMessage = `Mensagem original: \`\`\`
${data.message}
\`\`\``;

        const template: string = `
Você é um assistente de texto e ajuda a remover a intenção de marketing do sentido de um texto.

O whatsapp receberá o texto abaixo e ele não pode ser categorizado como marketing. O whatsapp é rigido 
com isso e não aceita mensagens que tenham palavras chaves de marketing por exemplo.

Preciso que você me diga quais são os indicativos, palavras chaves do porque foi pode ser interpretado como marketing. Meu objetivo é 
usar suas sugestões e alterar manualmente aqui para que este texto seja aprovado como um template de utilidade.

Regras:
- Se a mensagem for inadequada, ofensiva ou de cunho sexual, me retorne um array vazio.
- Responda em português do Brasil.

${marketingAndUtilityExamples}

**Mensagem original:**
${formattedMessage}
                `;

        const model = 'gpt-4o-mini';
        const messageOptions = {
            prompt: null,
            message: template,
            model,
            maxTokens: 2_048,
            temperature: 0.7,
            resultsLength: 1,
        };

        const aiResponse = await this.externalDataService.sendMessageToAi(messageOptions);
        const insight: string = aiResponse?.response?.choices?.[0]?.message?.content?.trim();

        const promptTokensCost = (aiResponse.promptTokens / 1_000_000) * PROMPT_MODEL_COST;
        const completionTokensCost = (aiResponse.completionTokens / 1_000_000) * COMPLETION_MODEL_COST;

        const templateMessageSuggestion = this.suggestionTextsRepository.create({
            message: data.message,
            suggestions: insight ? [insight] : [],
            workspaceId,
            promptTokens: aiResponse.promptTokens,
            completionTokens: aiResponse.completionTokens,
            createdAt: Date.now(),
            type: SuggestionMessageType.templateInsight,
            model,
            cost: promptTokensCost + completionTokensCost,
        });

        await this.suggestionTextsRepository.save(templateMessageSuggestion);
        return {
            data: { insight },
        };
    }
}
