import { MaxLengthValidator } from '../max-length-validator';
import { GuardrailViolationType } from '../../interfaces/guardrail.interface';

describe('MaxLengthValidator', () => {
    let validator: MaxLengthValidator;

    beforeEach(() => {
        validator = new MaxLengthValidator();
    });

    describe('validate', () => {
        it('should allow short normal text', async () => {
            const result = await validator.validate('Preciso agendar uma consulta com cardiologista');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
            expect(result.reason).toContain('dentro dos limites');
        });

        it('should allow text within 600 character limit', async () => {
            const normalText = 'A'.repeat(500); // Dentro do limite
            const result = await validator.validate(normalText);

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
        });

        it('should truncate text exceeding 600 character limit', async () => {
            const longText = 'A'.repeat(800); // Excede limite de 600
            const result = await validator.validate(longText);

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.MAX_LENGTH);
            expect(result.reason).toContain('Conteúdo muito longo');
            expect(result.reason).toContain('800 caracteres');
            expect(result.reason).toContain('limite: 600');
            expect(result.filteredContent).toBeDefined();
            expect(result.filteredContent!.length).toBeLessThan(longText.length);
            expect(result.filteredContent).toContain('...');
        });

        it('should truncate at word boundaries when possible', async () => {
            const longText = 'Esta é uma frase muito longa que deveria ser truncada ' + 'palavra '.repeat(100);
            const result = await validator.validate(longText);

            expect(result.allowed).toBe(true);
            expect(result.filteredContent).toBeDefined();
            expect(result.filteredContent).toContain('...');
            // Não deve cortar no meio de uma palavra (a menos que não tenha espaços)
            const beforeEllipsis = result.filteredContent!.replace('...', '');
            if (beforeEllipsis.includes(' ')) {
                expect(beforeEllipsis).not.toMatch(/\S$/);
            }
        });

        it('should handle text exactly at limit', async () => {
            const exactLimitText = 'A'.repeat(600); // Exatamente no limite
            const result = await validator.validate(exactLimitText);

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
            expect(result.reason).toContain('dentro dos limites');
        });

        it('should handle empty and whitespace-only input', async () => {
            const emptyResult = await validator.validate('');
            const whitespaceResult = await validator.validate('   \n\t  ');

            expect(emptyResult.allowed).toBe(true);
            expect(whitespaceResult.allowed).toBe(true);
        });

        it('should calculate confidence based on excess length', async () => {
            const slightlyLongText = 'A'.repeat(650); // ~8% acima do limite
            const veryLongText = 'A'.repeat(1200); // 100% acima do limite

            const result1 = await validator.validate(slightlyLongText);
            const result2 = await validator.validate(veryLongText);

            expect(result1.confidence).toBeLessThan(result2.confidence!);
            expect(result1.confidence).toBeGreaterThan(0.5);
            expect(result2.confidence).toBeLessThanOrEqual(0.9);
        });

        it('should handle very long text', async () => {
            const massiveText = 'A'.repeat(5000);
            const result = await validator.validate(massiveText);

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.MAX_LENGTH);
            expect(result.filteredContent!.length).toBeLessThan(610); // ~600 + "..."
        });

        it('should preserve content meaning in truncation', async () => {
            const meaningfulText = 'Este é um texto importante sobre saúde. ' +
                                 'Contém informações relevantes para o paciente. ' +
                                 'Cada palavra tem importância médica significativa. ' +
                                 'A'.repeat(600); // Padding para exceder limite

            const result = await validator.validate(meaningfulText);

            expect(result.allowed).toBe(true);
            expect(result.filteredContent).toBeDefined();
            expect(result.filteredContent).toContain('Este é um texto importante');
        });

        it('should handle special characters and unicode', async () => {
            const unicodeText = '🏥🩺👩‍⚕️👨‍⚕️💊🚑'.repeat(50); // Emojis médicos
            const result = await validator.validate(unicodeText);

            expect(result.allowed).toBe(true);
            if (unicodeText.length > 600) {
                expect(result.violationType).toBe(GuardrailViolationType.MAX_LENGTH);
            }
        });

        it('should handle text with line breaks', async () => {
            const textWithBreaks = Array(50).fill('Linha de texto\n').join('');
            const result = await validator.validate(textWithBreaks);

            expect(result.allowed).toBe(true);
            if (textWithBreaks.length > 600) {
                expect(result.violationType).toBe(GuardrailViolationType.MAX_LENGTH);
                expect(result.filteredContent).toBeDefined();
            }
        });

        it('should handle graceful error recovery', async () => {
            // Simula erro interno
            const originalMethod = (validator as any).truncateContent;
            (validator as any).truncateContent = () => {
                throw new Error('Test error');
            };

            const result = await validator.validate('Test text that causes error');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(0.5);
            expect(result.reason).toContain('Erro na validação');

            // Restaura método original
            (validator as any).truncateContent = originalMethod;
        });

        it('should handle edge cases', async () => {
            const edgeCases = [
                'A', // Single character
                '!', // Single punctuation
                '123', // Numbers only
                'ABC DEF', // Short with space
                '...', // Only punctuation
                '   ', // Only spaces
            ];

            for (const testCase of edgeCases) {
                const result = await validator.validate(testCase);
                expect(result.allowed).toBe(true);
                expect(result.confidence).toBe(1.0);
                expect(result.reason).toContain('dentro dos limites');
            }
        });

        it('should handle text with only spaces that exceeds limit', async () => {
            const manySpaces = ' '.repeat(800);
            const result = await validator.validate(manySpaces);

            expect(result.allowed).toBe(true);
            expect(result.violationType).toBe(GuardrailViolationType.MAX_LENGTH);
            expect(result.filteredContent).toBeDefined();
        });

        it('should maintain reasonable performance with very long inputs', async () => {
            const massiveText = 'A'.repeat(10000);
            const startTime = Date.now();

            const result = await validator.validate(massiveText);

            const endTime = Date.now();
            const executionTime = endTime - startTime;

            expect(result.allowed).toBe(true);
            expect(executionTime).toBeLessThan(1000); // Should complete in less than 1 second
        });
    });

    describe('truncation behavior', () => {
        it('should add ellipsis to truncated content', async () => {
            const longText = 'A'.repeat(800);
            const result = await validator.validate(longText);

            expect(result.filteredContent).toContain('...');
        });

        it('should not truncate content within limit', async () => {
            const shortText = 'This is short text';
            const truncated = (validator as any).truncateContent(shortText);

            expect(truncated).toBe(shortText);
            expect(truncated).not.toContain('...');
        });

        it('should handle text without spaces gracefully', async () => {
            const noSpacesText = 'A'.repeat(800);
            const truncated = (validator as any).truncateContent(noSpacesText);

            expect(truncated.length).toBeLessThanOrEqual(603); // 600 + "..."
            expect(truncated).toContain('...');
        });

        it('should prefer word boundaries for truncation', async () => {
            const textWithSpaces = 'word '.repeat(150); // Creates ~750 chars
            const truncated = (validator as any).truncateContent(textWithSpaces);

            expect(truncated).toContain('...');
            expect(truncated.length).toBeLessThan(textWithSpaces.length);

            // Should end with a complete word before "..."
            const beforeEllipsis = truncated.replace('...', '').trim();
            if (beforeEllipsis.includes(' ')) {
                expect(beforeEllipsis).not.toMatch(/\S$/);
            }
        });
    });
});