import { Injectable, Logger } from '@nestjs/common';
import {
    GuardrailValidator,
    GuardrailResult,
    GuardrailContext,
    GuardrailViolationType,
} from '../interfaces/guardrail.interface';

@Injectable()
export class ExcessiveRepetitionValidator implements GuardrailValidator {
    name = 'excessive-repetition';
    description = 'Detecta sequências excessivas de caracteres repetitivos';
    enabled = true;

    private readonly logger = new Logger(ExcessiveRepetitionValidator.name);

    // Configurações
    private readonly maxConsecutiveChars = 5; // Máximo de caracteres consecutivos iguais
    private readonly maxPatternRepeats = 3; // Máximo de padrões repetidos
    private readonly targetChars = ['!', '?', '.', '-', '_', '=', '*', '#']; // Caracteres a serem monitorados

    async validate(input: string, context?: GuardrailContext): Promise<GuardrailResult> {
        try {
            // 1. Verifica caracteres consecutivos excessivos
            const consecutiveViolation = this.checkConsecutiveCharacters(input);
            if (consecutiveViolation) {
                const sanitized = this.sanitizeInput(input);
                return {
                    allowed: true, // Permite a mensagem mas com conteúdo sanitizado
                    reason: `Sequência excessiva de caracteres detectada e corrigida: ${consecutiveViolation.sequence}`,
                    violationType: GuardrailViolationType.EXCESSIVE_REPETITION,
                    confidence: 0.9,
                    filteredContent: sanitized,
                };
            }

            // 2. Verifica padrões repetitivos
            const patternViolation = this.checkRepeatingPatterns(input);
            if (patternViolation) {
                const sanitized = this.sanitizeInput(input);
                return {
                    allowed: true, // Permite a mensagem mas com conteúdo sanitizado
                    reason: `Padrão repetitivo detectado e corrigido: ${patternViolation.pattern}`,
                    violationType: GuardrailViolationType.EXCESSIVE_REPETITION,
                    confidence: 0.8,
                    filteredContent: sanitized,
                };
            }

            return {
                allowed: true,
                reason: 'Nenhuma repetição excessiva detectada',
                confidence: 1.0,
            };
        } catch (error) {
            this.logger.error('Erro na validação de repetição excessiva:', error);
            return {
                allowed: true,
                reason: 'Erro na validação - permitindo por precaução',
                confidence: 0.5,
            };
        }
    }

    private checkConsecutiveCharacters(input: string): { sequence: string; count: number } | null {
        let currentChar = '';
        let count = 0;
        let maxCount = 0;
        let problematicSequence = '';

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            // Ignora espaços
            if (char === ' ') {
                // Reset apenas se o caractere atual mudou
                if (currentChar !== char) {
                    currentChar = '';
                    count = 0;
                }
                continue;
            }

            if (char === currentChar) {
                count++;
            } else {
                currentChar = char;
                count = 1;
            }

            // Só conta para caracteres que devem ser monitorados
            if (this.shouldMonitorChar(char) && count > maxCount) {
                maxCount = count;
                problematicSequence = char.repeat(count);
            }

            // Se ultrapassou o limite, retorna imediatamente
            if (count > this.maxConsecutiveChars && this.shouldMonitorChar(char)) {
                return {
                    sequence: problematicSequence,
                    count: maxCount,
                };
            }
        }

        return null;
    }

    private checkRepeatingPatterns(input: string): { pattern: string; count: number } | null {
        // Procura por padrões de 2-4 caracteres que se repetem
        for (let patternLength = 2; patternLength <= 4; patternLength++) {
            for (let i = 0; i <= input.length - patternLength * 2; i++) {
                const pattern = input.substring(i, i + patternLength);

                // Ignora padrões que são apenas espaços
                if (pattern.trim().length === 0) continue;

                // Conta quantas vezes o padrão se repete consecutivamente
                let repeatCount = 1;
                let nextIndex = i + patternLength;

                while (
                    nextIndex + patternLength <= input.length &&
                    input.substring(nextIndex, nextIndex + patternLength) === pattern
                ) {
                    repeatCount++;
                    nextIndex += patternLength;
                }

                if (repeatCount > this.maxPatternRepeats && this.containsTargetChars(pattern)) {
                    return {
                        pattern: pattern.repeat(repeatCount),
                        count: repeatCount,
                    };
                }
            }
        }

        return null;
    }

    private shouldMonitorChar(char: string): boolean {
        return this.targetChars.includes(char);
    }

    private containsTargetChars(pattern: string): boolean {
        return this.targetChars.some((char) => pattern.includes(char));
    }

    private sanitizeInput(input: string): string {
        let sanitized = input;

        // Remove caracteres consecutivos excessivos
        for (const char of this.targetChars) {
            const regex = new RegExp(`\\${char}{${this.maxConsecutiveChars + 1},}`, 'g');
            sanitized = sanitized.replace(regex, char.repeat(this.maxConsecutiveChars));
        }

        // Remove padrões repetitivos excessivos
        for (let patternLength = 2; patternLength <= 4; patternLength++) {
            for (let i = 0; i <= sanitized.length - patternLength * 2; i++) {
                const pattern = sanitized.substring(i, i + patternLength);

                if (pattern.trim().length === 0 || !this.containsTargetChars(pattern)) continue;

                const repeatedPattern = pattern.repeat(this.maxPatternRepeats + 1);
                const maxAllowedPattern = pattern.repeat(this.maxPatternRepeats);

                // Substituir padrão excessivo pelo máximo permitido
                const regex = new RegExp(this.escapeRegExp(repeatedPattern) + '+', 'g');
                sanitized = sanitized.replace(regex, maxAllowedPattern);
            }
        }

        return sanitized.trim();
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
