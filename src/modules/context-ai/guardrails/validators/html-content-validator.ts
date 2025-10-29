import { Injectable, Logger } from '@nestjs/common';
import {
    GuardrailValidator,
    GuardrailResult,
    GuardrailContext,
    GuardrailViolationType,
} from '../interfaces/guardrail.interface';

@Injectable()
export class HtmlContentValidator implements GuardrailValidator {
    name = 'html-content';
    description = 'Detecta e bloqueia conteúdo HTML para evitar processamento desnecessário';
    enabled = true;

    private readonly logger = new Logger(HtmlContentValidator.name);

    // Padrões para detectar HTML
    private readonly htmlPatterns = [
        /<\s*([a-z][a-z0-9]*)\b[^>]*>/gi, // Tags HTML abertas
        /<\s*\/\s*([a-z][a-z0-9]*)\s*>/gi, // Tags HTML fechadas
        /<!DOCTYPE\s+html/gi, // DOCTYPE
        /&[a-z]+;/gi, // HTML entities (&nbsp;, &lt;, etc)
    ];

    // Threshold: percentual mínimo de conteúdo que parece HTML para bloquear
    private readonly htmlThreshold = 0.10; // 10% do texto contém HTML

    // Mínimo de tags HTML para considerar como HTML
    private readonly minHtmlTags = 3;

    async validate(input: string, _context?: GuardrailContext): Promise<GuardrailResult> {
        try {
            const htmlDetection = this.detectHtml(input);

            if (htmlDetection.isHtml) {
                return {
                    allowed: false,
                    reason: `Conteúdo HTML detectado (${htmlDetection.tagCount} tags, ${(htmlDetection.htmlRatio * 100).toFixed(1)}% do conteúdo). HTML não é processado para evitar desperdício de recursos.`,
                    violationType: GuardrailViolationType.HTML_CONTENT,
                    confidence: htmlDetection.confidence,
                };
            }

            return {
                allowed: true,
                reason: 'Nenhum conteúdo HTML significativo detectado',
                confidence: 1.0,
            };
        } catch (error) {
            this.logger.error('Erro na validação de conteúdo HTML:', error);
            return {
                allowed: true,
                reason: 'Erro na validação - permitindo por precaução',
                confidence: 0.5,
            };
        }
    }

    private detectHtml(input: string): {
        isHtml: boolean;
        tagCount: number;
        htmlRatio: number;
        confidence: number;
    } {
        let tagCount = 0;
        let htmlCharCount = 0;

        // Conta tags HTML
        for (const pattern of this.htmlPatterns) {
            const matches = input.match(pattern);
            if (matches) {
                tagCount += matches.length;
                // Soma o comprimento de todas as tags encontradas
                htmlCharCount += matches.reduce((sum, match) => sum + match.length, 0);
            }
            // Reset regex lastIndex
            pattern.lastIndex = 0;
        }

        // Calcula proporção de HTML no texto
        const inputLength = input.length;
        const htmlRatio = inputLength > 0 ? htmlCharCount / inputLength : 0;

        // Verifica se tem DOCTYPE ou estrutura HTML básica
        const hasDoctype = /<!DOCTYPE\s+html/gi.test(input);
        const hasHtmlTag = /<html[^>]*>/gi.test(input);
        const hasHeadTag = /<head[^>]*>/gi.test(input);
        const hasBodyTag = /<body[^>]*>/gi.test(input);

        // Documento HTML completo = alta confiança
        const isFullHtmlDocument = hasDoctype || (hasHtmlTag && (hasHeadTag || hasBodyTag));

        let confidence = 0;
        let isHtml = false;

        if (isFullHtmlDocument) {
            // Documento HTML completo
            isHtml = true;
            confidence = 0.99;
        } else if (tagCount >= this.minHtmlTags && htmlRatio >= this.htmlThreshold) {
            // Muitas tags e proporção alta
            isHtml = true;
            confidence = Math.min(0.95, 0.7 + htmlRatio);
        } else if (tagCount >= this.minHtmlTags * 3) {
            // Muitas tags mesmo com proporção baixa (texto longo com HTML)
            isHtml = true;
            confidence = Math.min(0.9, 0.6 + tagCount / 50);
        }

        return {
            isHtml,
            tagCount,
            htmlRatio,
            confidence,
        };
    }
}
