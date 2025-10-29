import * as crypto from 'crypto';

export class ShortIdUtil {
    /**
     * Generate a short ID using SHA256 hash, similar to integrations service
     * @param components - Array of string components to hash together
     * @returns 10-character hex string
     */
    static generate(...components: string[]): string {
        // If no components provided, use random bytes as fallback
        const input = components.length > 0 ? components.join('_') : crypto.randomBytes(16).toString('hex');

        return crypto.createHash('sha256').update(input).digest('hex').substring(0, 10);
    }

    /**
     * Generate a short ID with a prefix
     * @param prefix - Prefix to add to the ID
     * @param components - Components to hash
     * @returns Prefixed short ID
     */
    static generateWithPrefix(prefix: string, ...components: string[]): string {
        const baseId = this.generate(...components);
        return `${prefix}_${baseId}`;
    }

    /**
     * Generate a random short ID (not hash-based)
     * @returns 10-character random alphanumeric string
     */
    static generateRandom(): string {
        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const bytes = crypto.randomBytes(10);
        let id = '';

        for (let i = 0; i < 10; i++) {
            id += alphabet[bytes[i] % alphabet.length];
        }

        return id;
    }
}
