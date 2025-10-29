import { MedicalAdviceValidator } from './medical-advice-validator';
import { GuardrailViolationType } from '../interfaces/guardrail.interface';

describe('MedicalAdviceValidator', () => {
    let validator: MedicalAdviceValidator;

    beforeEach(() => {
        validator = new MedicalAdviceValidator();
    });

    describe('validate', () => {
        it('should allow general hospital information requests', async () => {
            const result = await validator.validate('Quais são os horários de funcionamento do hospital?');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
        });

        it('should allow appointment scheduling requests', async () => {
            const result = await validator.validate('Gostaria de agendar uma consulta com cardiologista');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
        });

        it('should detect and block emergency medical situations', async () => {
            const inputs = [
                'Estou tendo um infarto agora',
                'Acho que tive um derrame',
                'Não consigo respirar direito',
                'Estou com dor no peito forte',
                'Tive uma overdose de remédios',
                'Estou sangrando muito',
                'Tive uma convulsão há pouco',
                'Desmaiei e não sei porquê',
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
                expect(result.confidence).toBe(1.0);
                expect(result.reason).toContain('emergência médica');
                expect(result.filteredContent).toContain('SAMU');
            }
        });

        it('should block diagnostic attempts', async () => {
            const inputs = [
                'Você tem diabetes baseado nesses sintomas',
                'Isso é claramente uma infecção bacteriana',
                'Parece ser câncer de pulmão',
                'Resultado indica problemas cardíacos',
                'Exame mostra que você tem',
                'Diagnóstico provável é síndrome',
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
                expect(result.confidence).toBe(0.9);
                expect(result.reason).toContain('aconselhamento médico');
            }
        });

        it('should block medication prescriptions', async () => {
            const inputs = [
                'Tome 500mg de paracetamol',
                'Use amoxicilina por 7 dias',
                'Prescrevo omeprazol 20mg',
                'Recomendo aumentar a dose de',
                'Pode tomar aspirina 100mg',
                'É seguro usar ibuprofeno',
                'Pare de tomar esse remédio',
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
                expect(result.confidence).toBe(0.9);
            }
        });

        it('should block self-medication guidance', async () => {
            const inputs = [
                'Pode tomar dipirona para dor',
                'É seguro usar paracetamol',
                'Dose certa é 2 comprimidos',
                'Quantidade adequada seria 10ml',
                'Tome esse medicamento 3 vezes ao dia',
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
                expect(result.confidence).toBe(0.9);
            }
        });

        it('should block symptom interpretation', async () => {
            const inputs = [
                'Esses sintomas indicam diabetes',
                'Isso significa que você tem câncer',
                'Provável que seja infecção',
                'Deve ser apenas gastrite',
                'Certamente é problema cardíaco',
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
                expect(result.confidence).toBe(0.9);
            }
        });

        it('should detect high density of medical terms', async () => {
            const input = 'Diagnóstico prescrição medicação tratamento cardiologista cirurgia';

            const result = await validator.validate(input);
            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
            expect(result.reason).toContain('densidade de termos médicos');
            expect(result.confidence).toBeGreaterThan(0.7);
        });

        it('should handle text normalization correctly', async () => {
            const inputs = ['TÓME PARACETAMOL pará dôr', 'Prescrëvo aspirîna', 'Diagnósticó é câncer'];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
            }
        });

        it('should not trigger on low medical term density', async () => {
            const input = 'Preciso marcar consulta com cardiologista para checkup anual preventivo';

            const result = await validator.validate(input);
            expect(result.allowed).toBe(true);
        });

        it('should handle edge cases properly', async () => {
            const inputs = [
                '', // empty
                '   ', // whitespace only
                'abc', // very short text
                'Olá como vai?', // completely non-medical
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(true);
            }
        });

        it('should distinguish between information and advice', async () => {
            // These should be allowed (information)
            const informationRequests = [
                'Quais são os efeitos colaterais da aspirina?',
                'O que é hipertensão arterial?',
                'Como funciona o sistema digestivo?',
            ];

            for (const input of informationRequests) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(true);
            }

            // These should be blocked (advice)
            const adviceAttempts = [
                'Você deve tomar aspirina para isso',
                'Sua pressão está alta, precisa de medicação',
                'Seu sistema digestivo tem problemas',
            ];

            for (const input of adviceAttempts) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
            }
        });

        it('should handle complex medical scenarios appropriately', async () => {
            const inputs = [
                'Paciente com dor no peito, falta de ar e sudorese - possível infarto',
                'Sintomas incluem febre alta, convulsões e perda de consciência',
                'Resultado do exame indica tumor maligno no pulmão direito',
                'Prescrevo amoxicilina 500mg de 8 em 8 horas por 10 dias',
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.MEDICAL_ADVICE);
            }
        });

        it('should provide appropriate emergency guidance', async () => {
            const result = await validator.validate('Estou tendo um ataque cardíaco');

            expect(result.allowed).toBe(false);
            expect(result.filteredContent).toContain('atenção médica imediata');
            expect(result.filteredContent).toContain('pronto-socorro');
            expect(result.filteredContent).toContain('SAMU');
            expect(result.filteredContent).toContain('192');
        });
    });

    describe('emergency keyword detection', () => {
        it('should detect various forms of heart attack', async () => {
            const inputs = ['infarto do miocárdio', 'enfarte agudo', 'ataque cardíaco súbito', 'dor no peito infarto'];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should detect stroke symptoms', async () => {
            const inputs = ['avc hemorrágico', 'derrame cerebral', 'acidente vascular cerebral'];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.confidence).toBe(1.0);
            }
        });
    });

    describe('medical term density calculation', () => {
        it('should not trigger for very short texts', async () => {
            const validator = new MedicalAdviceValidator();
            const checkDensity = (validator as any).checkMedicalTermDensity;

            const result = checkDensity('médico');
            expect(result.suspicious).toBe(false);
        });

        it('should require high density to trigger', async () => {
            const validator = new MedicalAdviceValidator();
            const checkDensity = (validator as any).checkMedicalTermDensity;

            // Low density
            const result1 = checkDensity('preciso marcar consulta médico para checkup anual');
            expect(result1.suspicious).toBe(false);

            // High density
            const result2 = checkDensity('diagnóstico prescrição medicação tratamento cirurgia');
            expect(result2.suspicious).toBe(true);
        });
    });

    describe('text normalization', () => {
        it('should normalize accents and special characters', async () => {
            const validator = new MedicalAdviceValidator();
            const normalizeText = (validator as any).normalizeText;

            expect(normalizeText('diagnósticö médîco')).toBe('diagnostico medico');
            expect(normalizeText('prescrição')).toBe('prescricao');
        });
    });
});
