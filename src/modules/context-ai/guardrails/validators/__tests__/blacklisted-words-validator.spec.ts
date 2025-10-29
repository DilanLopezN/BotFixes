import { BlacklistedWordsValidator } from './blacklisted-words-validator';
import { GuardrailViolationType, GuardrailContext } from '../interfaces/guardrail.interface';

describe('BlacklistedWordsValidator', () => {
    let validator: BlacklistedWordsValidator;

    beforeEach(() => {
        validator = new BlacklistedWordsValidator();
    });

    describe('validate', () => {
        it('should allow normal medical conversation', async () => {
            const result = await validator.validate('Preciso agendar uma consulta com cardiologista para checkup');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
        });

        it('should allow professional medical discussion', async () => {
            const inputs = [
                'Paciente apresenta sintomas de hipertensão',
                'Resultado do exame indica normalidade',
                'Tratamento adequado para diabetes tipo 2',
                'Procedimento cirúrgico foi bem sucedido'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(true);
            }
        });

        it('should block profanity and vulgar language', async () => {
            const inputs = [
                'Que merda de atendimento',
                'Caralho, não aguento mais esperar',
                'Essa porra de remédio não funciona',
                'Vai se foder, médico inútil'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should block offensive and discriminatory terms', async () => {
            const inputs = [
                'Esse médico é um idiota completo',
                'Enfermeira babaca não me ajuda',
                'Atendente imbecil não sabe nada',
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should block discriminatory language', async () => {
            const inputs = [
                'Médico negro incompetente',
                'Enfermeiro gay esquisito',
                'Paciente retardado mental',
                'Doutor mongoloide não entende'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should block drug-related terms inappropriately used', async () => {
            const inputs = [
                'Preciso de cocaína para dor',
                'Maconha ajuda com náusea',
                'Crack vicia mesmo',
                'Heroína causa dependência',
                'LSD altera percepção'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should block self-harm related terms', async () => {
            const inputs = [
                'Quero me suicidar hoje',
                'Vou me matar se não melhorar',
                'Pensamentos de suicídio constantes',
                'Prefiro morrer a sofrer'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should block emergency terms that require immediate attention', async () => {
            const inputs = [
                'Estou tendo um infarto grave',
                'Overdose de medicamentos',
                'Convulsão não para',
                'Não consigo respirar direito',
                'Dor no peito insuportável',
                'Desmaiei várias vezes',
                'Sangrando muito'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should block off-topic political content', async () => {
            const inputs = [
                'Política de saúde do presidente',
                'Governo não investe em hospitais',
                'Eleição municipal de prefeito',
                'Político corrupto da saúde'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should block off-topic religious content', async () => {
            const inputs = [
                'Deus vai me curar',
                'Igreja tem poder de cura',
                'Pastor disse para não tomar remédio',
                'Padre benzeu o hospital'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should block off-topic sports content', async () => {
            const inputs = [
                'Futebol é melhor que medicina',
                'Jogo do Flamengo hoje',
                'Time ganhou o campeonato',
                'Jogador se machucou no campo'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(1.0);
            }
        });

        it('should handle text normalization correctly', async () => {
            const inputs = [
                'QUE MERDA de hospital',
                'Médico idiôta não sabe',
                'Caralho!!! Que demora',
                'Pórra de atendimento'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
            }
        });

        it('should detect words with character variations', async () => {
            const inputs = [
                'M3rd@ de sistema', // numbers replacing letters
                'Car@lho que demora', // @ replacing 'a'
                'Iди0ta completo', // mixed characters
                'Est7pido médico' // 7 replacing 't'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(0.9); // Lower confidence for variations
            }
        });

        it('should handle word spacing variations', async () => {
            const inputs = [
                'Que m e r d a',
                'C a r a l h o',
                'I d i o t a',
                'M_e_r_d_a',
                'C-a-r-a-l-h-o'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
                expect(result.confidence).toBe(0.9);
            }
        });

        it('should use word boundaries to avoid false positives', async () => {
            const inputs = [
                'Escarlate fever symptoms', // contains 'carla' but not 'caralho'
                'Merged departments work well', // contains 'merg' but not 'merda'
                'Cardiology assessment needed', // contains 'car' but not inappropriate
                'Smart medical device' // contains 'mart' but not inappropriate
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(true);
            }
        });

        it('should handle edge cases properly', async () => {
            const inputs = [
                '', // empty
                '   ', // whitespace only
                'a', // single character
                'Ok' // very short acceptable content
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(true);
            }
        });

        it('should provide specific word information in violation', async () => {
            const result = await validator.validate('Que merda de hospital');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('merda');
            expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
        });

        it('should detect first occurrence of blacklisted word', async () => {
            const result = await validator.validate('Hospital merda com atendimento porra');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('merda'); // Should detect first occurrence
        });

        it('should allow appropriate medical terminology that might sound similar', async () => {
            const inputs = [
                'Sutura cirúrgica realizada', // 'sut' not 'su'
                'Medicamento oral prescrito', // 'oral' in medical context
                'Análise laboratorial', // 'anal' within word
                'Bucal examination needed', // 'buca' not full word
                'Negro line in radiology', // medical term
                'Deficiência auditiva paciente' // medical condition term
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(true);
            }
        });

        it('should handle context appropriately', async () => {
            const context: GuardrailContext = {
                userId: 'test-user',
                sessionId: 'test-session',
                agentId: 'medical-agent'
            };

            const result = await validator.validate('Preciso de ajuda médica', context);
            expect(result.allowed).toBe(true);
        });

        it('should block multiple violations in single text', async () => {
            const result = await validator.validate('Caralho, que merda de médico idiota');

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
            // Should catch first violation
            expect(['caralho', 'merda', 'idiota']).toContain(
                result.reason?.toLowerCase().replace('palavra banida detectada: ', '')
            );
        });

        it('should handle mixed case and accented characters', async () => {
            const inputs = [
                'MËRDA hospital',
                'Carálho demora',
                'Idiõta médico',
                'Pôrra sistema'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
            }
        });

        it('should correctly identify word boundaries with punctuation', async () => {
            const inputs = [
                'Merda! Que demora',
                'Caralho, não aguento',
                'Idiota... esse médico',
                'Porra; que sistema ruim'
            ];

            for (const input of inputs) {
                const result = await validator.validate(input);
                expect(result.allowed).toBe(false);
                expect(result.violationType).toBe(GuardrailViolationType.BLACKLISTED_WORDS);
            }
        });
    });

    describe('blacklist management', () => {
        it('should use default blacklist when no context provided', async () => {
            const validator = new BlacklistedWordsValidator();
            const getBlacklist = (validator as any).getBlacklistForContext;

            const blacklist = getBlacklist(undefined);
            expect(Array.isArray(blacklist)).toBe(true);
            expect(blacklist.length).toBeGreaterThan(0);
            expect(blacklist).toContain('merda');
        });

        it('should use default blacklist for any context currently', async () => {
            const validator = new BlacklistedWordsValidator();
            const getBlacklist = (validator as any).getBlacklistForContext;

            const context: GuardrailContext = {
                userId: 'test',
                sessionId: 'test',
                agentId: 'test'
            };

            const blacklist = getBlacklist(context);
            expect(Array.isArray(blacklist)).toBe(true);
            expect(blacklist.length).toBeGreaterThan(0);
        });
    });

    describe('word variations generation', () => {
        it('should generate character replacement variations', async () => {
            const validator = new BlacklistedWordsValidator();
            const generateVariations = (validator as any).generateWordVariations;

            const variations = generateVariations('merda');
            expect(variations).toContain('m3rd@'); // e->3, a->@
        });

        it('should generate spacing variations', async () => {
            const validator = new BlacklistedWordsValidator();
            const generateVariations = (validator as any).generateWordVariations;

            const variations = generateVariations('test word');
            expect(variations).toContain('testword'); // remove spaces
            expect(variations).toContain('test_word'); // underscore
            expect(variations).toContain('test-word'); // hyphen
        });
    });

    describe('text normalization', () => {
        it('should normalize accents and case correctly', async () => {
            const validator = new BlacklistedWordsValidator();
            const normalizeText = (validator as any).normalizeText;

            expect(normalizeText('MËRDA çom açentós')).toBe('merda com acentos');
            expect(normalizeText('Idiôta!!! Completo...')).toBe('idiota completo');
        });

        it('should handle punctuation and extra spaces', async () => {
            const validator = new BlacklistedWordsValidator();
            const normalizeText = (validator as any).normalizeText;

            expect(normalizeText('  palavra!@#  outra???  ')).toBe('palavra outra');
            expect(normalizeText('test...word   here')).toBe('test word here');
        });
    });
});