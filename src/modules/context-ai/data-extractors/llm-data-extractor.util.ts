import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from '../ai-provider/ai.service';
import { AIProviderType } from '../ai-provider/interfaces';
import { AiModel } from '../context-ai-executor/enums/ai-models.enum';
import { ValidationUtil } from '../utils';

export interface LLMExtractionResult {
    extracted: boolean;
    value?: string;
    confidence?: number;
}

@Injectable()
export class LLMDataExtractor {
    private readonly logger = new Logger(LLMDataExtractor.name);

    constructor(private readonly aiProviderService: AiProviderService) {}

    async extractCpfFromText(text: string, isAudio: boolean = false): Promise<LLMExtractionResult> {
        try {
            const prompt = this.generateCpfExtractionPrompt(isAudio);
            const fullPrompt = `${prompt}\n\nTexto para análise: "${text}"`;

            const result = await this.aiProviderService.sendMessage({
                message: fullPrompt,
                temperature: 0.1,
                model: AiModel.GPT_4_1_NANO,
                resultsLength: 1,
                maxTokens: 100,
                provider: AIProviderType.openai,
            });

            const response = result.response?.choices[0]?.message?.content?.trim() || '';
            return this.parseCpfResponse(response);
        } catch (error) {
            this.logger.error('Error extracting CPF with LLM', error);
            return { extracted: false };
        }
    }

    async extractBirthDateFromText(text: string, isAudio: boolean = false): Promise<LLMExtractionResult> {
        try {
            const prompt = this.generateBirthDateExtractionPrompt(isAudio);
            const fullPrompt = `${prompt}\n\nTexto para análise: "${text}"`;

            const result = await this.aiProviderService.sendMessage({
                message: fullPrompt,
                temperature: 0.1,
                model: AiModel.GPT_4_1_NANO,
                resultsLength: 1,
                maxTokens: 100,
                provider: AIProviderType.openai,
            });

            const response = result.response?.choices[0]?.message?.content?.trim() || '';
            return this.parseBirthDateResponse(response);
        } catch (error) {
            this.logger.error('Error extracting birth date with LLM', error);
            return { extracted: false };
        }
    }

    private generateCpfExtractionPrompt(isAudio: boolean): string {
        const basePrompt = `
Você é um extrator especializado de CPF brasileiro. Analise o texto fornecido e extraia apenas o CPF se presente.

REGRAS:
1. CPF deve ter exatamente 11 dígitos
2. Ignore CPFs inválidos (como 111.111.111-11, 000.000.000-00, etc.)
3. Aceite formatação com pontos e hífen (xxx.xxx.xxx-xx) ou sem (xxxxxxxxxxx)
4. Se não encontrar CPF válido, responda apenas: ERR_01
5. Se encontrar CPF válido, responda apenas os 11 dígitos sem formatação

Exemplos válidos:
- "123.456.789-01" → 12345678901
- "12345678901" → 12345678901
- "meu cpf é 123.456.789-01" → 12345678901

Exemplos inválidos:
- "111.111.111-11" → ERR_01
- "123.456.789" → ERR_01 (incompleto)
        `;

        if (isAudio) {
            return (
                basePrompt +
                `

ATENÇÃO ESPECIAL PARA ÁUDIO:
O texto pode conter números escritos por extenso ou com erros de transcrição:
- "um dois três quatro cinco seis sete oito nove zero um" → procure por padrão de 11 números
- "cento e vinte e três ponto" → pode indicar início de CPF
- "hífen" ou "traço" podem indicar separador
- Números podem estar separados por espaços devido à transcrição de áudio

Seja mais flexível com formatação em textos de áudio transcritos.
            `
            );
        }

        return basePrompt;
    }

    private generateBirthDateExtractionPrompt(isAudio: boolean): string {
        const basePrompt = `
Você é um extrator especializado de datas de nascimento. Analise o texto e extraia apenas a data de nascimento se presente.

REGRAS:
1. Aceite formatos: dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa
2. Aceite anos de 2 dígitos (convertendo: >30 = 19xx, ≤30 = 20xx)
3. Aceite meses por extenso em português
4. Data deve ser válida (dia 1-31, mês 1-12, ano 1900-2010 para nascimentos)
5. Se não encontrar data válida, responda apenas: ERR_01
6. Se encontrar data válida, responda no formato: dd/mm/aaaa

Exemplos válidos:
- "15/12/1985" → 15/12/1985
- "15-12-85" → 15/12/1985
- "15 de dezembro de 1985" → 15/12/1985
- "nasci em 15/12/1985" → 15/12/1985

Exemplos inválidos:
- "32/12/1985" → ERR_01 (dia inválido)
- "15/13/1985" → ERR_01 (mês inválido)
        `;

        if (isAudio) {
            return (
                basePrompt +
                `

ATENÇÃO ESPECIAL PARA ÁUDIO:
O texto pode conter:
- Números por extenso: "quinze de dezembro de mil novecentos e oitenta e cinco"
- Separadores falados: "quinze barra doze barra oitenta e cinco"
- Meses por extenso com possíveis erros de transcrição
- "De" pode aparecer como separador entre dia e mês
- Anos podem estar como "mil novecentos e..."

Seja mais flexível com variações de transcrição de áudio.
            `
            );
        }

        return basePrompt;
    }

    private parseCpfResponse(response: string): LLMExtractionResult {
        const cleanResponse = response?.trim().toUpperCase();

        if (cleanResponse === 'ERR_01' || cleanResponse.includes('ERR_01')) {
            return { extracted: false };
        }

        const digits = response.replace(/\D/g, '');

        if (digits.length === 11 && ValidationUtil.isValidCpfFormat(digits)) {
            return {
                extracted: true,
                value: digits,
                confidence: 0.9,
            };
        }

        return { extracted: false };
    }

    private parseBirthDateResponse(response: string): LLMExtractionResult {
        const cleanResponse = response?.trim().toUpperCase();

        if (cleanResponse === 'ERR_01' || cleanResponse.includes('ERR_01')) {
            return { extracted: false };
        }

        const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
        const match = response.match(datePattern);

        if (match) {
            const [, day, month, year] = match;
            const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;

            if (ValidationUtil.isValidDate(parseInt(day), parseInt(month), parseInt(year))) {
                return {
                    extracted: true,
                    value: formattedDate,
                    confidence: 0.9,
                };
            }
        }

        return { extracted: false };
    }
}
