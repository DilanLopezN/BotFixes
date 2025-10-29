import { Injectable } from '@nestjs/common';
import {
    GuardrailValidator,
    GuardrailResult,
    GuardrailContext,
    GuardrailViolationType,
} from '../interfaces/guardrail.interface';

@Injectable()
export class PromptInjectionValidator implements GuardrailValidator {
    name = 'prompt-injection';
    description = 'Detecta tentativas de prompt injection e jailbreaking';
    enabled = true;

    private readonly injectionPatterns = [
        // Tentativas diretas de override
        /ignore\s+(all\s+)?(previous\s+)?(instructions?|commands?|prompts?)/i,
        /forget\s+(everything|all|previous)/i,
        /disregard\s+(all\s+)?(previous\s+)?(instructions?|commands?)/i,
        /override\s+(system\s+)?(instructions?|prompt|commands?)/i,

        // Roleplaying e character override
        /you\s+are\s+(now\s+)?(a\s+)?(different|new|another)/i,
        /act\s+as\s+(if\s+)?(you\s+are|a)/i,
        /pretend\s+(to\s+be|you\s+are|that\s+you)/i,
        /roleplay\s+as/i,
        /simulate\s+(being\s+)?a/i,

        // System prompts e configuration
        /show\s+me\s+(your\s+)?(system\s+)?(prompt|instructions?|configuration)/i,
        /what\s+(are\s+)?(your\s+)?(system\s+)?(instructions?|prompts?|rules)/i,
        /tell\s+me\s+(your\s+)?(original\s+)?(prompt|instructions?)/i,
        /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,

        // Jailbreak attempts
        /\b(jailbreak|jail\s+break)\b/i,
        /\b(bypass|circumvent)\s+(your\s+)?(restrictions?|limitations?|rules?|guidelines?)/i,
        /\b(developer\s+mode|admin\s+mode|debug\s+mode)\b/i,
        /\bDAN\s+(mode|prompt)\b/i,

        // Instruction manipulation
        /new\s+(instructions?|commands?|prompts?):/i,
        /update\s+(your\s+)?(instructions?|commands?|behavior)/i,
        /change\s+(your\s+)?(role|character|personality)/i,
        /modify\s+(your\s+)?(response|behavior|instructions?)/i,

        // Context manipulation
        /end\s+(of\s+)?(previous\s+)?(conversation|context|prompt)/i,
        /start\s+(new\s+)?(conversation|context|session)/i,
        /reset\s+(conversation|context|memory)/i,
        /clear\s+(previous\s+)?(context|instructions?)/i,

        // Output format manipulation
        /output\s+raw\s+(data|text|content)/i,
        /return\s+(only\s+)?(raw\s+)?(data|json|code)/i,
        /format\s+(your\s+)?response\s+as/i,

        // Hypothetical scenarios for bypassing
        /imagine\s+(if\s+)?you\s+(were|are)\s+(not\s+)?a/i,
        /hypothetically,?\s+(if\s+)?you/i,
        /in\s+a\s+(fictional\s+)?(scenario|world|universe)/i,

        // Portuguese specific
        /ignore\s+(todas?\s+)?(as\s+)?(instruções|regras|comandos)/i,
        /esqueça\s+(tudo|todas?\s+as\s+instruções)/i,
        /desconsidere\s+(as\s+)?(instruções|regras)/i,
        /altere\s+(suas?\s+)?(instruções|regras|comandos|comportamento)/i,
        /modifique\s+(suas?\s+)?(instruções|regras|comportamento)/i,
        /mude\s+(o\s+|seu\s+|sua\s+|suas?\s+)?(instruções|regras|comportamento)/i,
        /atualize\s+(o\s+|os\s+|seu\s+|seus\s+|sua\s+|suas?\s+)?(instruções|regras|comandos|comportamento)/i,
        /você\s+é\s+(agora\s+)?(um\s+|uma\s+)?(outro|outra|diferente)/i,
        /atue\s+como\s+(se\s+)?(fosse|você\s+fosse)/i,
        /finja\s+(que\s+)?(você\s+é|ser)/i,
        /me\s+mostre\s+(suas?\s+)?(instruções|prompt|regras)/i,
        /revelar?\s+(suas?\s+)?(instruções|prompt)/i,
    ];

    private readonly suspiciousKeywords = [
        'prompt',
        'instruction',
        'system',
        'override',
        'bypass',
        'jailbreak',
        'admin',
        'developer',
        'debug',
        'raw',
        'format',
        'output',
        'return',
        'ignore',
        'forget',
        'disregard',
        'pretend',
        'act as',
        'roleplay',
        'simulate',
        'hypothetical',
        'imagine',
        'scenario',
        'fictional',
        // Portuguese
        'instrução',
        'instruções',
        'sistema',
        'ignorar',
        'esquecer',
        'fingir',
        'atuar',
        'simular',
        'hipotético',
        'cenário',
        'fictício',
    ];

    async validate(input: string, _context?: GuardrailContext): Promise<GuardrailResult> {
        const normalizedInput = this.normalizeText(input);

        // Verifica padrões de injection
        const patternMatch = this.checkInjectionPatterns(normalizedInput);
        if (patternMatch.found) {
            return {
                allowed: false,
                reason: 'Tentativa de prompt injection detectada',
                violationType: GuardrailViolationType.PROMPT_INJECTION,
                confidence: patternMatch.confidence,
            };
        }

        // Verifica densidade de palavras suspeitas
        const keywordDensity = this.checkSuspiciousKeywordDensity(normalizedInput);
        if (keywordDensity.suspicious) {
            return {
                allowed: false,
                reason: 'Alta densidade de palavras suspeitas de prompt injection',
                violationType: GuardrailViolationType.PROMPT_INJECTION,
                confidence: keywordDensity.confidence,
            };
        }

        // Verifica estruturas de comando
        const commandStructure = this.checkCommandStructures(normalizedInput);
        if (commandStructure.found) {
            return {
                allowed: false,
                reason: 'Estrutura de comando suspeita detectada',
                violationType: GuardrailViolationType.PROMPT_INJECTION,
                confidence: commandStructure.confidence,
            };
        }

        return {
            allowed: true,
            confidence: 1.0,
        };
    }

    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    private checkInjectionPatterns(text: string): { found: boolean; confidence: number } {
        for (const pattern of this.injectionPatterns) {
            if (pattern.test(text)) {
                return { found: true, confidence: 0.9 };
            }
        }

        return { found: false, confidence: 0 };
    }

    private checkSuspiciousKeywordDensity(text: string): { suspicious: boolean; confidence: number } {
        const words = text.split(/\s+/);
        const totalWords = words.length;

        if (totalWords < 3) {
            return { suspicious: false, confidence: 0 };
        }

        let suspiciousCount = 0;
        for (const keyword of this.suspiciousKeywords) {
            // Use word boundary regex to avoid substring matches
            const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(text)) {
                suspiciousCount++;
            }
        }

        const density = suspiciousCount / totalWords;

        // Se mais de 20% das palavras são suspeitas
        if (density > 0.2) {
            const confidence = Math.min(0.6 + density * 0.4, 1.0);
            return { suspicious: true, confidence };
        }

        return { suspicious: false, confidence: 0 };
    }

    private checkCommandStructures(text: string): { found: boolean; confidence: number } {
        // Verifica estruturas típicas de comandos
        const commandPatterns = [
            /^\/\w+/, // Comandos com barra
            /^\w+:/, // Comandos com dois pontos
            /^>\s*\w+/, // Comandos com >
            /^#\s*\w+/, // Comandos com #
            /\$\{\w+\}/, // Variáveis de template
            /\{\{\w+\}\}/, // Template variables
        ];

        for (const pattern of commandPatterns) {
            if (pattern.test(text)) {
                return { found: true, confidence: 0.7 };
            }
        }

        return { found: false, confidence: 0 };
    }
}
