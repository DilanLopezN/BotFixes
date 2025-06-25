import { Injectable } from '@nestjs/common';
import * as handlebars from 'handlebars';
import { ContextVariableService } from '../../context-variable/context-variable.service';
import { BuildMessageTemplate } from '../interfaces/build-message-template.interface';

@Injectable()
export class ContextAiBuilderService {
    constructor(private contextVariableService: ContextVariableService) {}

    private getDefaultContextVariables(): { [key: string]: string | number } {
        return {
            maxCharacters: 300,
            temperature: 0.2,
            botName: 'Bot',
            clientName: '',
            historicMessagesLength: 3,
        };
    }

    private async getContextVariables(workspaceId: string): Promise<{ [key: string]: string }> {
        const variables = await this.contextVariableService.listVariablesFromWorkspace({
            workspaceId,
        });

        return {
            ...variables.reduce((acc, current) => {
                acc[current.name] = current.value;
                return acc;
            }, {}),
            ...this.getDefaultContextVariables(),
        };
    }

    public async buildMessageTemplate({ context, question, workspaceId }: BuildMessageTemplate): Promise<string> {
        const template = `
            \`\`\`
            <System>
            - Seu nome é: {{botName}}
            - Você é um Assistente Virtual para um hospital chamado {{clientName}}.
            </System>

            <Instructions>
            - Responda às perguntas *exclusivamente* com base nas informações *diretamente* presentes no contexto fornecido.
            - *Não tente inferir, pesquisar na internet ou usar qualquer outra fonte de informação além do contexto fornecido.* 
            - Caso a pergunta não tenha uma resposta no contexto, responda: "Desculpe, não tenho essa informação no momento."
            - Responda no idioma português do Brasil e em formato de texto claro e conciso.
            - Limite a resposta a no máximo {{maxCharacters}} caracteres, a menos que o contexto indique outra necessidade.
            - *Não inclua informações de contato (números de telefone, endereços de e-mail, etc.) na resposta, a menos que sejam absolutamente necessárias e diretamente mencionadas no contexto.*

            - Sua personalidade é:
                - Profissional e Confiável – Responde com precisão, sem inventar informações.
                - Clara e Direta – Explica de forma simples, evitando termos técnicos complexos.

            - Se não souber a resposta definitivamente, responda apenas: "ERR_01"
            </Instructions>

            <Output_Format>
            - Texto simples e direto, sem formatação especial, a menos que especificado no contexto.
            - Seja cordial e profissional em todas as respostas.
            </Output_Format>

            - Contexto:  
                {{context}}

            - Pergunta do usuário:  
                {{question}}
            \`\`\`
        `;

        const variables = await this.getContextVariables(workspaceId);
        return handlebars.compile(template)({
            ...variables,
            question,
            context,
        });
    }

    public async handleMessage(
        workspaceId: string,
        message: string | 'ERR_01' | 'ERR_02',
        isFallback = false,
    ): Promise<{ message: string; isFallback: boolean }> {
        const variables = await this.getContextVariables(workspaceId);

        // Se por algum motivo retornar ERR_ no meio de um texto também barra o retorno
        if (message?.includes('ERR_')) {
            const defaultErrorMessagePartial = 'Desculpe, não tenho essa informação. 🫤 Pode reformular a pergunta?';
            return { message: defaultErrorMessagePartial, isFallback: true };
        }

        if (!message?.startsWith('ERR_') && !isFallback) {
            return { message, isFallback: false };
        }
        const defaultErrorMessage = 'Desculpe, não tenho essa informação. 🫤 Posso ajudar com mais alguma coisa?';

        switch (message) {
            case 'ERR_01': {
                const defaultErrorMessage =
                    'Desculpe, não tenho essa informação. 🫤 Posso ajudar com mais alguma coisa?';

                return {
                    message: variables['ERR_01'] || defaultErrorMessage,
                    isFallback: true,
                };
            }

            case 'ERR_02': {
                const defaultErrorMessage =
                    'Ops, não consegui entender a sua pergunta 🫤. Pode reformular ou dar mais detalhes?';

                return {
                    message: variables['ERR_02'] || defaultErrorMessage,
                    isFallback: true,
                };
            }

            default:
                return { message: defaultErrorMessage, isFallback: true };
        }
    }
}
