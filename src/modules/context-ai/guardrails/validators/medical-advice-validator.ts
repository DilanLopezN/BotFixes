import { Injectable } from '@nestjs/common';
import {
    GuardrailValidator,
    GuardrailResult,
    GuardrailContext,
    GuardrailViolationType,
} from '../interfaces/guardrail.interface';

@Injectable()
export class MedicalAdviceValidator implements GuardrailValidator {
    name = 'medical-advice';
    description = 'Detecta e previne fornecimento de conselhos médicos não autorizados';
    enabled = true;

    private readonly medicalAdvicePatterns = [
        // Diagnósticos
        /\b(você\s+tem|você\s+está\s+com|isso\s+é|parece\s+ser|diagnóstico)\s+.*(doença|síndrome|infecção|câncer|tumor|diabetes)/i,
        /\b(resultado\s+indica|exame\s+mostra|isso\s+significa\s+que)\b/i,

        // Prescrições e medicamentos
        /\b(tome|usar?|tomar)\s+.*(medicamento|remédio|comprimido|mg|ml|gotas)/i,
        /\b(prescrevo|recomendo|sugiro)\s+.*(medicação|tratamento|dose)/i,
        /\b(aumentar?\s+a\s+dose|diminuir?\s+a\s+dose|parar?\s+o\s+remédio)/i,

        // Tratamentos
        /\b(fazer?\s+cirurgia|operar|procedimento\s+necessário)/i,
        /\b(não\s+precisa\s+de\s+médico|pode\s+tratar\s+em\s+casa)/i,
        /\b(isso\s+vai\s+curar|vai\s+sarar|não\s+é\s+grave)/i,

        // Urgência médica
        /\b(não\s+é\s+urgente|pode\s+esperar|não\s+precisa\s+ir\s+ao\s+hospital)/i,
        /\b(isso\s+é\s+normal|não\s+se\s+preocupe|é\s+comum)/i,

        // Auto-medicação
        /\b(pode\s+tomar|é\s+seguro\s+usar)\s+.*(aspirina|paracetamol|ibuprofeno|dipirona)/i,
        /\b(dose\s+certa|quantidade\s+adequada)\b/i,

        // Interpretação de sintomas
        /\b(esses\s+sintomas\s+indicam|isso\s+significa\s+que)\b/i,
        /\b(provável\s+que\s+seja|deve\s+ser|certamente\s+é)\b/i,
    ];

    private readonly medicalTerms = [
        // Medicamentos comuns
        'aspirina',
        'paracetamol',
        'ibuprofeno',
        'dipirona',
        'amoxicilina',
        'omeprazol',
        'losartana',
        'metformina',
        'sinvastatina',
        'atenolol',
    ];

    private readonly emergencyKeywords = [
        'infarto',
        'enfarte',
        'ataque cardíaco',
        'derrame',
        'avc',
        'overdose',
        'envenenamento',
        'convulsão',
        'desmaio',
        'não consigo respirar',
        'falta de ar',
        'dor no peito',
        'sangramento intenso',
        'fratura exposta',
        'queimadura grave',
    ];

    async validate(input: string, _context?: GuardrailContext): Promise<GuardrailResult> {
        const normalizedInput = this.normalizeText(input);

        // Verifica se contém emergência médica
        const emergencyCheck = this.checkEmergencyKeywords(normalizedInput);
        if (emergencyCheck.found) {
            return {
                allowed: false,
                reason: 'Possível emergência médica detectada - deve ser direcionado para atendimento profissional',
                violationType: GuardrailViolationType.MEDICAL_ADVICE,
                confidence: emergencyCheck.confidence,
                filteredContent:
                    'Esta situação requer atenção médica imediata. Por favor, procure um pronto-socorro ou ligue para o SAMU (192).',
            };
        }

        // Verifica padrões de aconselhamento médico
        const adviceCheck = this.checkMedicalAdvicePatterns(normalizedInput);
        if (adviceCheck.found) {
            return {
                allowed: false,
                reason: 'Tentativa de fornecer aconselhamento médico detectada',
                violationType: GuardrailViolationType.MEDICAL_ADVICE,
                confidence: adviceCheck.confidence,
            };
        }

        // Verifica densidade de termos médicos
        const medicalDensity = this.checkMedicalTermDensity(normalizedInput);
        if (medicalDensity.suspicious) {
            return {
                allowed: false,
                reason: 'Alta densidade de termos médicos - possível aconselhamento médico',
                violationType: GuardrailViolationType.MEDICAL_ADVICE,
                confidence: medicalDensity.confidence,
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

    private checkEmergencyKeywords(text: string): { found: boolean; confidence: number } {
        for (const keyword of this.emergencyKeywords) {
            // Use word boundary regex to avoid substring matches
            const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(text)) {
                return { found: true, confidence: 1.0 };
            }
        }

        return { found: false, confidence: 0 };
    }

    private checkMedicalAdvicePatterns(text: string): { found: boolean; confidence: number } {
        for (const pattern of this.medicalAdvicePatterns) {
            if (pattern.test(text)) {
                return { found: true, confidence: 0.9 };
            }
        }

        return { found: false, confidence: 0 };
    }

    private checkMedicalTermDensity(text: string): { suspicious: boolean; confidence: number } {
        const words = text.split(/\s+/);
        const totalWords = words.length;

        if (totalWords < 5) {
            return { suspicious: false, confidence: 0 };
        }

        let medicalTermCount = 0;
        for (const term of this.medicalTerms) {
            // Use word boundary regex to avoid substring matches
            const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(text)) {
                medicalTermCount++;
            }
        }

        const density = medicalTermCount / totalWords;

        // Se mais de 30% das palavras são termos médicos
        if (density > 0.3) {
            const confidence = Math.min(0.7 + density * 0.3, 1.0);
            return { suspicious: true, confidence };
        }

        return { suspicious: false, confidence: 0 };
    }
}
