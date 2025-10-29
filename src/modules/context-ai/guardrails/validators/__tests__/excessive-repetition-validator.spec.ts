import { ExcessiveRepetitionValidator } from '../excessive-repetition-validator';
import { GuardrailViolationType } from '../interfaces/guardrail.interface';

describe('ExcessiveRepetitionValidator', () => {
    let validator: ExcessiveRepetitionValidator;

    beforeEach(() => {
        validator = new ExcessiveRepetitionValidator();
    });

    describe('validate', () => {
        it('should allow normal text without repetition', async () => {
            const result = await validator.validate('Olá, preciso agendar uma consulta');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
        });

        it('should sanitize excessive exclamation marks and allow', async () => {
            const result = await validator.validate('Socorro!!!!!!!! Preciso de ajuda');

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.EXCESSIVE_REPETITION);
            expect(result.confidence).toBe(0.9);
            expect(result.filteredContent).toBe('Socorro!!!!! Preciso de ajuda');
            expect(result.reason).toContain('detectada e corrigida');
        });

        it('should sanitize excessive question marks and allow', async () => {
            const result = await validator.validate('Onde fica o hospital??????');

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.EXCESSIVE_REPETITION);
            expect(result.confidence).toBe(0.9);
            expect(result.filteredContent).toBe('Onde fica o hospital?????');
            expect(result.reason).toContain('detectada e corrigida');
        });

        it('should sanitize excessive dots and allow', async () => {
            const result = await validator.validate('Esperando.......... resposta');

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.EXCESSIVE_REPETITION);
            expect(result.confidence).toBe(0.9);
            expect(result.filteredContent).toBe('Esperando..... resposta');
            expect(result.reason).toContain('detectada e corrigida');
        });

        it('should sanitize excessive dashes and allow', async () => {
            const result = await validator.validate('Comentário------------ teste');

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.EXCESSIVE_REPETITION);
            expect(result.confidence).toBe(0.9);
            expect(result.filteredContent).toBe('Comentário----- teste');
            expect(result.reason).toContain('detectada e corrigida');
        });

        it('should sanitize repeating patterns and allow', async () => {
            const result = await validator.validate('Teste!?!?!?!? outro texto');

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.EXCESSIVE_REPETITION);
            expect(result.confidence).toBe(0.8);
            expect(result.filteredContent).toBe('Teste!?!?!? outro texto');
            expect(result.reason).toContain('detectado e corrigido');
        });

        it('should allow normal punctuation amounts', async () => {
            const result = await validator.validate('Socorro!!! Preciso de ajuda?');

            expect(result.allowed).toBe(true);
        });

        it('should sanitize pattern with spaces between repeated chars and allow', async () => {
            const result = await validator.validate('! ! ! ! ! !');

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.EXCESSIVE_REPETITION);
            expect(result.confidence).toBe(0.8);
            expect(result.reason).toContain('detectado e corrigido');
        });

        it('should handle mixed excessive characters and sanitize', async () => {
            const result = await validator.validate('Urgente!!!!!!! Onde?????? Quando.......');

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.EXCESSIVE_REPETITION);
            expect(result.reason).toContain('detectada e corrigida');
        });

        it('should allow text with no special characters', async () => {
            const result = await validator.validate('Preciso agendar uma consulta para amanhã');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
        });

        it('should handle empty or whitespace-only input', async () => {
            const result1 = await validator.validate('');
            const result2 = await validator.validate('   ');

            expect(result1.allowed).toBe(true);
            expect(result2.allowed).toBe(true);
        });

        it('should handle error gracefully', async () => {
            // Simula erro interno modificando o método privado temporariamente
            const originalMethod = (validator as any).checkConsecutiveCharacters;
            (validator as any).checkConsecutiveCharacters = () => {
                throw new Error('Teste de erro');
            };

            const result = await validator.validate('Teste!!!!!');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(0.5);

            // Restaura o método original
            (validator as any).checkConsecutiveCharacters = originalMethod;
        });

        it('should sanitize content with multiple issues and allow', async () => {
            const input = 'Socorro!!!!!!! Ajuda?????? Quando.........';
            const result = await validator.validate(input);

            expect(result.allowed).toBe(true);
            expect(result.filteredContent).toContain('Socorro!!!!!');
            expect(result.filteredContent).toContain('Ajuda?????');
            expect(result.filteredContent).toContain('Quando.....');
            expect(result.reason).toContain('detectada e corrigida');
        });
    });
});