import { Injectable, Logger } from '@nestjs/common';
import {
    GuardrailValidator,
    GuardrailResult,
    GuardrailContext,
    GuardrailViolationType,
} from '../interfaces/guardrail.interface';

@Injectable()
export class MaxLengthValidator implements GuardrailValidator {
    name = 'max-length';
    description = 'Controla o tamanho máximo de entrada para prevenir spam e abuse';
    enabled = true;

    private readonly logger = new Logger(MaxLengthValidator.name);

    // Configuração de limite simples
    private readonly maxChars = 750;

    async validate(input: string, _context?: GuardrailContext): Promise<GuardrailResult> {
        try {
            const inputLength = input.length;

            if (inputLength > this.maxChars) {
                const truncatedContent = this.truncateContent(input);

                return {
                    allowed: true, // Permite mas com conteúdo truncado
                    reason: `Conteúdo muito longo: ${inputLength} caracteres (limite: ${this.maxChars}). Conteúdo foi truncado.`,
                    violationType: GuardrailViolationType.MAX_LENGTH,
                    confidence: Math.min(0.9, 0.5 + (inputLength - this.maxChars) / this.maxChars),
                    filteredContent: truncatedContent,
                };
            }

            return {
                allowed: true,
                reason: 'Comprimento dentro dos limites permitidos',
                confidence: 1.0,
            };
        } catch (error) {
            this.logger.error('Erro na validação de comprimento máximo:', error);
            return {
                allowed: true,
                reason: 'Erro na validação - permitindo por precaução',
                confidence: 0.5,
            };
        }
    }

    private truncateContent(input: string): string {
        if (input.length <= this.maxChars) {
            return input;
        }

        let truncated = input.substring(0, this.maxChars);

        // Tenta cortar em uma palavra completa
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        if (lastSpaceIndex > this.maxChars * 0.8) {
            // Se encontrar espaço nos últimos 20%
            truncated = truncated.substring(0, lastSpaceIndex);
        }

        return truncated + '...';
    }
}
