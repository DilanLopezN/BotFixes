/**
 * Utilitário SafeRegex para proteção contra ataques ReDoS
 * Fornece execução segura de regex com timeout e validação de entrada
 */
export class SafeRegex {
    private static readonly DEFAULT_TIMEOUT_MS = 100;
    private static readonly MAX_INPUT_LENGTH = 5000;

    /**
     * Executa regex com proteção contra ReDoS
     * @param pattern - Padrão regex a ser testado
     * @param text - Texto de entrada
     * @param options - Opções de configuração
     * @returns boolean - Resultado do teste ou false em caso de erro/timeout
     */
    static test(
        pattern: RegExp,
        text: string,
        options: {
            timeout?: number;
            maxLength?: number;
            context?: string;
        } = {},
    ): boolean {
        const {
            timeout = SafeRegex.DEFAULT_TIMEOUT_MS,
            maxLength = SafeRegex.MAX_INPUT_LENGTH,
            context = 'SafeRegex',
        } = options;

        try {
            // Proteção 1: Validação de tamanho de entrada
            if (text.length > maxLength) {
                console.warn(`🚨 ${context}: Input too long (${text.length} > ${maxLength})`);
                return false;
            }

            // Proteção 2: Execução com monitoramento de tempo
            const startTime = Date.now();
            const result = pattern.test(text);
            const duration = Date.now() - startTime;

            // Proteção 3: Detecção de regex lento (possível ReDoS)
            if (duration > timeout) {
                console.warn(`🚨 ${context}: Slow regex detected - Pattern took ${duration}ms (limit: ${timeout}ms)`);
                return false;
            }

            return result;
        } catch (error) {
            console.warn(`🚨 ${context}: Regex execution error:`, error.message);
            return false;
        }
    }

    /**
     * Executa regex replace com proteção contra ReDoS
     * @param pattern - Padrão regex a ser usado
     * @param text - Texto de entrada
     * @param replacement - String de substituição
     * @param options - Opções de configuração
     * @returns string - Texto processado ou original em caso de erro
     */
    static replace(
        pattern: RegExp,
        text: string,
        replacement: string,
        options: {
            timeout?: number;
            maxLength?: number;
            context?: string;
        } = {},
    ): string {
        const {
            timeout = SafeRegex.DEFAULT_TIMEOUT_MS,
            maxLength = SafeRegex.MAX_INPUT_LENGTH,
            context = 'SafeRegex',
        } = options;

        try {
            // Proteção 1: Validação de tamanho de entrada
            if (text.length > maxLength) {
                console.warn(`🚨 ${context}: Input too long for replace (${text.length} > ${maxLength})`);
                return text;
            }

            // Proteção 2: Execução com monitoramento de tempo
            const startTime = Date.now();
            const result = text.replace(pattern, replacement);
            const duration = Date.now() - startTime;

            // Proteção 3: Detecção de regex lento (possível ReDoS)
            if (duration > timeout) {
                console.warn(
                    `🚨 ${context}: Slow regex replace detected - Pattern took ${duration}ms (limit: ${timeout}ms)`,
                );
                return text; // Retorna texto original em caso de timeout
            }

            return result;
        } catch (error) {
            console.warn(`🚨 ${context}: Regex replace error:`, error.message);
            return text; // Retorna texto original em caso de erro
        }
    }

    /**
     * Verifica se um padrão regex é potencialmente perigoso
     * @param pattern - Padrão regex a ser validado
     * @returns boolean - true se o padrão parecer perigoso
     */
    static isDangerousPattern(pattern: RegExp): boolean {
        const patternString = pattern.source;

        // Padrões conhecidos por causar ReDoS
        const dangerousPatterns = [
            /\(\.\*\)\+/, // (.*)+
            /\(\.\*\)\*/, // (.*)*
            /\(.+\)\+/, // (.+)+
            /\(.+\)\*/, // (.+)*
            /\(.{100,}\)/, // Grupos muito grandes
            /\{[0-9]{3,}\}/, // Quantificadores muito grandes
        ];

        return dangerousPatterns.some((dangerous) => dangerous.test(patternString));
    }
}
