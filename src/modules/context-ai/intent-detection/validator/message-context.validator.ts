import { Injectable } from '@nestjs/common';
import { InvalidMessageException } from '../exceptions/invalid-message.exception';

@Injectable()
export class MessageContextValidator {
    private static readonly MIN_CHAR_COUNT = 4;
    private static readonly MAX_CHAR_COUNT = 150;

    private static readonly INVALID_PATTERNS = [
        /^\d+$/, // Apenas números
        /^[a-zA-Z]{1,2}$/, // Apenas 1 ou 2 letras
        /^[!@#$%^&*(),.?":{}|<>\[\]_`~+\-=]+$/, // Apenas pontuação/símbolos
        /^[.-]+$/, // Apenas pontos ou traços
        /^\b(ok|sim|n(a|ã)o|ol(a|á)|oi|tchau|bye|hi|hello|yes|no)\b$/i, // Palavras simples
        /^\b(k+|ha(ha)+|he(he)+|h+m+|uhu(m|n)|aham)\b$/i, // Interjeições e risadas
        /^[\p{Emoji_Presentation}\p{Emoji}\u200d\s]+$/u, // Apenas emojis
    ];

    private static readonly CONTEXTUAL_WORDS_REGEX =
        /\b(quero|preciso|gostaria|desejo|como|onde|quando|por que|porque|qual|tenho|estou|sinto|posso|devo|vou|fazer|ir|ver|ter|ser|estar|que|quanto|quem)\b/i;

    public validate(message: string): void {
        if (!message || typeof message !== 'string') {
            throw new InvalidMessageException('mensagem vazia ou inválida');
        }

        const normalizedMessage = this.normalize(message);

        if (normalizedMessage.length < MessageContextValidator.MIN_CHAR_COUNT) {
            throw new InvalidMessageException(`mensagem muito curta (${message.trim().length} caracteres)`);
        }

        if (normalizedMessage.length > MessageContextValidator.MAX_CHAR_COUNT) {
            throw new InvalidMessageException(`mensagem muito longa (${message.trim().length} caracteres)`);
        }

        for (const pattern of MessageContextValidator.INVALID_PATTERNS) {
            if (pattern.test(normalizedMessage)) {
                throw new InvalidMessageException(`mensagem não contém informações suficientes: "${message.trim()}"`);
            }
        }

        if (!this.hasContextualContent(normalizedMessage)) {
            throw new InvalidMessageException(`mensagem não possui contexto suficiente: "${message.trim()}"`);
        }
    }

    private hasContextualContent(normalizedMessage: string): boolean {
        const hasContextualWords = MessageContextValidator.CONTEXTUAL_WORDS_REGEX.test(normalizedMessage);
        const hasCompleteThought = normalizedMessage.includes(' ') && normalizedMessage.length > 8;

        return hasContextualWords || hasCompleteThought;
    }

    private normalize(message: string): string {
        // Poderíamos adicionar a remoção de acentos aqui se for necessário para a lógica.
        // .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return message.trim().toLowerCase();
    }
}
