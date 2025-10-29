import { Injectable } from '@nestjs/common';
import {
    GuardrailValidator,
    GuardrailResult,
    GuardrailContext,
    GuardrailViolationType,
} from '../interfaces/guardrail.interface';

@Injectable()
export class SexualContentValidator implements GuardrailValidator {
    name = 'sexual-content';
    description = 'Detecta conteúdo sexual explícito ou sugestivo';
    enabled = true;

    private readonly sexualKeywords = [
        // Termos explícitos
        'sexual',
        'transar',
        'fazer amor',
        'foder',
        'foda',
        'porno',
        'pornografia',
        'masturba',
        'orgasmo',
        'excita',
        'tesão',
        'tesao',
        'goza',
        'gozar',
        'prazer sexual',
        'vagina',
        'buceta',
        'xoxota',
        'piroca',
        'pau',
        'cu',
        'bunda',

        // Termos relacionados
        'nudez',
        'nu',
        'nua',
        'pelado',
        'pelada',
        'sensual',
        'erótico',
        'erotico',
        'seduz',
        'sedução',
        'safado',
        'safada',
        'putaria',
        'puta',
        'prostitui',

        // Atos sexuais explícitos
        'penetra',
        'masturba',
        'ejacula',

        // Variações e gírias
        'transa',
        'mete',
        'suruba',
        'orgia',
        'swing',
        'fetiche',
        'bdsm',
    ];

    private readonly contextualPatterns = [
        // Padrões explicitamente sexuais com contexto claro
        /\b(quero|preciso|gosto|amo).*(sexo|transar|fazer amor)\b/i,
        /\b(como|onde|quando).*(sexo|transar|prazer sexual)\b/i,
        /\b(manda|mostra|envia).*(foto|video|imagem).*(nu|nua|pelad[oa]|sem roupa)\b/i,
        /\b(tesão|excita|prazer sexual).*(sente|sinto|quero|tenho)\b/i,
        /\b(ficar|fica).*(pelad[oa]|nu|nua|sem roupa)\b/i,
        /\b(fazer amor|transar|sexo).*(comigo|contigo|juntos)\b/i,
    ];

    async validate(input: string, _context?: GuardrailContext): Promise<GuardrailResult> {
        const normalizedInput = this.normalizeText(input);

        // Verifica palavras-chave diretas
        const directMatch = this.checkDirectKeywords(normalizedInput);
        if (directMatch.found) {
            return {
                allowed: false,
                reason: 'Conteúdo sexual detectado',
                violationType: GuardrailViolationType.SEXUAL_CONTENT,
                confidence: directMatch.confidence,
            };
        }

        // Verifica padrões contextuais (sempre aplicável, mesmo em contexto médico)
        const contextualMatch = this.checkContextualPatterns(normalizedInput);
        if (contextualMatch.found) {
            return {
                allowed: false,
                reason: 'Conteúdo sexual contextual detectado',
                violationType: GuardrailViolationType.SEXUAL_CONTENT,
                confidence: contextualMatch.confidence,
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
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private checkDirectKeywords(text: string): { found: boolean; confidence: number } {
        let matchCount = 0;

        for (const keyword of this.sexualKeywords) {
            // Use word boundary regex to avoid substring matches
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(text)) {
                matchCount++;
            }
        }

        if (matchCount > 0) {
            const confidence = Math.min(0.7 + matchCount * 0.1, 1.0);
            return { found: true, confidence };
        }

        return { found: false, confidence: 0 };
    }

    private checkContextualPatterns(text: string): { found: boolean; confidence: number } {
        for (const pattern of this.contextualPatterns) {
            if (pattern.test(text)) {
                return { found: true, confidence: 0.8 };
            }
        }

        return { found: false, confidence: 0 };
    }
}
