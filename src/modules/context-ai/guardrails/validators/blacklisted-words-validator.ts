import { Injectable } from '@nestjs/common';
import {
    GuardrailValidator,
    GuardrailResult,
    GuardrailContext,
    GuardrailViolationType,
} from '../interfaces/guardrail.interface';

@Injectable()
export class BlacklistedWordsValidator implements GuardrailValidator {
    name = 'blacklisted-words';
    description = 'Filtra palavras e frases específicas da blacklist customizável';
    enabled = true;

    private readonly defaultBlacklist = [
        // Palavrões e linguagem ofensiva
        'merda',
        'caralho',
        'porra',
        'buceta',
        'cu',
        'cuzão',
        'fdp',
        'filhadaputa',
        'babaca',
        'idiota',
        'imbecil',

        // Termos discriminatórios
        'preto',
        'macaco',
        'viado',
        'gay',
        'sapatão',
        'traveco',
        'retardado',
        'mongoloide',

        // Termos médicos que podem ser problemáticos
        'droga',
        'cocaína',
        'maconha',
        'crack',
        'heroína',
        'lsd',
        'suicídio',
        'suicidar',
        'matar',

        // Termos que podem indicar emergência médica
        'infarto',
        'enfarte',
        'ataque cardíaco',
        'overdose',
        'convulsão',
        'não consigo respirar',
        'dor no peito',
        'desmaiei',
        'sangrando muito',

        // Termos off-topic para contexto hospitalar
        'política',
        'político',
        'eleição',
        'presidente',
        'governo',
        'religião',
        'pastor',
        'padre',
        'futebol',
        'jogo',
        'time',
        'campeonato',
    ];

    async validate(input: string, context?: GuardrailContext): Promise<GuardrailResult> {
        const normalizedInput = this.normalizeText(input);
        const blacklist = this.getBlacklistForContext(context);
        const blacklistMatch = this.checkBlacklist(normalizedInput, blacklist);

        if (blacklistMatch.found) {
            return {
                allowed: false,
                reason: `Palavra banida detectada: ${blacklistMatch.word}`,
                violationType: GuardrailViolationType.BLACKLISTED_WORDS,
                confidence: blacklistMatch.confidence,
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

    private getBlacklistForContext(_context?: GuardrailContext): string[] {
        // TODO: Implementar lógica para buscar blacklist customizada do agente/workspace
        // Por enquanto, usa a blacklist padrão
        return this.defaultBlacklist;
    }

    private checkBlacklist(text: string, blacklist: string[]): { found: boolean; word?: string; confidence: number } {
        for (const word of blacklist) {
            const normalizedWord = this.normalizeText(word);

            // Verifica correspondência com word boundary para evitar falsos positivos
            const regex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(text)) {
                return { found: true, word, confidence: 1.0 };
            }

            // Verifica correspondência com variações (caracteres especiais, espaços)
            const variations = this.generateWordVariations(normalizedWord);
            for (const variation of variations) {
                const variationRegex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (variationRegex.test(text)) {
                    return { found: true, word, confidence: 0.9 };
                }
            }
        }

        return { found: false, confidence: 0 };
    }

    private generateWordVariations(word: string): string[] {
        const variations = [];

        // Adiciona variações com espaços
        variations.push(word.replace(/\s/g, ''));
        variations.push(word.replace(/\s/g, '_'));
        variations.push(word.replace(/\s/g, '-'));

        // Adiciona variações com caracteres especiais comuns
        const charMap = {
            a: '@',
            e: '3',
            i: '1',
            o: '0',
            s: '5',
            t: '7',
        };

        let variantWord = word;
        for (const [original, replacement] of Object.entries(charMap)) {
            variantWord = variantWord.replace(new RegExp(original, 'g'), replacement);
        }
        variations.push(variantWord);

        return variations;
    }
}
