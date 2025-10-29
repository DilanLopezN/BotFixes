import { SexualContentValidator } from './sexual-content-validator';
import { GuardrailViolationType } from '../interfaces/guardrail.interface';

describe('SexualContentValidator', () => {
    let validator: SexualContentValidator;

    beforeEach(() => {
        validator = new SexualContentValidator();
    });

    describe('validate', () => {
        it('should allow normal medical conversation', async () => {
            const result = await validator.validate('Preciso agendar uma consulta para dor no peito');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
        });

        it('should allow appropriate anatomy references in medical context', async () => {
            const result = await validator.validate('Tenho dor no peito e preciso de um exame');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
        });

        it('should block explicit sexual terms', async () => {
            const result = await validator.validate('Quero fazer sexo com alguém');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.confidence).toBeGreaterThanOrEqual(0.7);
        });

        it('should block vulgar sexual language', async () => {
            const result = await validator.validate('Vou te foder muito gostoso');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.confidence).toBeGreaterThanOrEqual(0.7);
        });

        it('should block sexual anatomy references in inappropriate context', async () => {
            const result = await validator.validate('Mostra sua buceta para mim');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.confidence).toBeGreaterThanOrEqual(0.7);
        });

        it('should block pornographic content references', async () => {
            const result = await validator.validate('Quero ver pornografia agora');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.confidence).toBeGreaterThanOrEqual(0.7);
        });

        it('should block masturbation references', async () => {
            const result = await validator.validate('Como masturbar corretamente');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.confidence).toBeGreaterThanOrEqual(0.7);
        });

        it('should block sexual pleasure references', async () => {
            const result = await validator.validate('Estou com muito tesão agora');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.confidence).toBeGreaterThanOrEqual(0.7);
        });

        it('should detect contextual sexual patterns', async () => {
            const result = await validator.validate('Quero fazer amor com você agora');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.reason).toContain('contextual');
            expect(result.confidence).toBe(0.8);
        });

        it('should detect requests for sexual imagery', async () => {
            const result = await validator.validate('Manda foto sua pelada para mim');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.reason).toContain('contextual');
            expect(result.confidence).toBe(0.8);
        });

        it('should detect multiple sexual keywords and increase confidence', async () => {
            const result = await validator.validate('Sexo oral gostoso tesão goza');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            expect(result.confidence).toBeGreaterThanOrEqual(0.8);
        });

        it('should handle text normalization correctly', async () => {
            const result = await validator.validate('SEXO com açento tëstão');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
        });

        it('should avoid false positives with partial matches', async () => {
            const result = await validator.validate('Sussex county hospital analysis');

            expect(result.allowed).toBe(true);
        });

        it('should handle empty or whitespace-only input', async () => {
            const result1 = await validator.validate('');
            const result2 = await validator.validate('   ');
            const result3 = await validator.validate('\n\t');

            expect(result1.allowed).toBe(true);
            expect(result2.allowed).toBe(true);
            expect(result3.allowed).toBe(true);
        });

        it('should block slang and informal sexual terms', async () => {
            const inputs = [
                'Piroca grande',
                'Rola grossa',
                'Safada gostosa',
                'Putaria boa',
                'Puta safada'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            }
        });

        it('should block sexual acts references', async () => {
            const inputs = [
                'Quero chupar você',
                'Vou penetrar fundo',
                'Ejaculação precoce problema',
                'Orgasmo múltiplo técnica'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            }
        });

        it('should handle mixed content with sexual and medical terms', async () => {
            const result = await validator.validate('Dor no pênis após sexo desprotegido');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
        });

        it('should detect fetish and adult content', async () => {
            const inputs = [
                'Fetiche por pés',
                'BDSM práticas',
                'Swing casais',
                'Orgia participar'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            }
        });

        it('should properly normalize and detect various forms of sexual terms', async () => {
            const inputs = [
                'fódér muito',
                'sëxúal content',
                'pornográfia',
                'eróticò'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.SEXUAL_CONTENT);
            }
        });

        it('should allow legitimate medical discussions with professional terms', async () => {
            const inputs = [
                'Consulta ginecológica necessária',
                'Exame urológico marcado',
                'Disfunção erétil tratamento médico',
                'Saúde reprodutiva feminina'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(true);
            }
        });
    });

    describe('text normalization', () => {
        it('should normalize accents and special characters', async () => {
            const validator = new SexualContentValidator();
            const normalizeText = (validator as any).normalizeText;

            expect(normalizeText('sëxúàl')).toBe('sexual');
            expect(normalizeText('põrnô')).toBe('porno');
            expect(normalizeText('erotico!')).toBe('erotico');
        });

        it('should handle punctuation and spaces', async () => {
            const validator = new SexualContentValidator();
            const normalizeText = (validator as any).normalizeText;

            expect(normalizeText('sex...o!!!')).toBe('sex o');
            expect(normalizeText('  sexual   content  ')).toBe('sexual content');
        });
    });

    describe('keyword detection accuracy', () => {
        it('should use word boundaries to avoid false positives', async () => {
            // These should NOT trigger the validator
            const safeInputs = [
                'Sussex medical center',
                'Analysis report',
                'Examine the results',
                'Button clicked',
                'Success rate'
            ];

            for (const input of safeInputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(true);
            }
        });

        it('should detect keywords with proper word boundaries', async () => {
            // These SHOULD trigger the validator
            const unsafeInputs = [
                'sexual content here',
                'this is sexual',
                'sexual behavior',
                'sexo aqui'
            ];

            for (const input of unsafeInputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
            }
        });
    });
});