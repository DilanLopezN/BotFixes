import { Injectable, Logger } from '@nestjs/common';
import { LLMDataExtractor } from './llm-data-extractor.util';
import { ValidationUtil } from '../utils';

export interface ExtractionResult {
    extracted: boolean;
    value?: string;
    confidence?: number;
}

@Injectable()
export class DataExtractionUtil {
    private readonly logger = new Logger(DataExtractionUtil.name);

    constructor(private readonly llmExtractor: LLMDataExtractor) {}

    async extractCpf(text: string, isAudio: boolean = false): Promise<ExtractionResult> {
        try {
            if (isAudio) {
                return await this.llmExtractor.extractCpfFromText(text, isAudio);
            }

            return this.extractCpfFromText(text);
        } catch (error) {
            this.logger.error('Error in extractCpf', error);
            return { extracted: false };
        }
    }

    async extractBirthDate(text: string, isAudio: boolean = false): Promise<ExtractionResult> {
        try {
            if (isAudio) {
                return await this.llmExtractor.extractBirthDateFromText(text, isAudio);
            }

            const regexResult = this.extractBirthDateFromText(text);

            if (!regexResult.extracted) {
                return await this.llmExtractor.extractBirthDateFromText(text, false);
            }

            return regexResult;
        } catch (error) {
            this.logger.error('Error in extractBirthDate', error);
            return { extracted: false };
        }
    }

    private extractCpfFromText(text: string): ExtractionResult {
        try {
            const digitsOnly = text.replace(/\D/g, '');
            const matches = digitsOnly.match(/\d{11}/g);

            if (!matches) {
                return { extracted: false };
            }

            for (const candidate of matches) {
                if (ValidationUtil.isValidCpfFormat(candidate)) {
                    return {
                        extracted: true,
                        value: candidate,
                        confidence: 0.9,
                    };
                }
            }

            return { extracted: false };
        } catch (error) {
            this.logger.error('Error extracting CPF from text', error);
            return { extracted: false };
        }
    }

    private extractBirthDateFromText(text: string): ExtractionResult {
        try {
            // Padrão 1: Data com separadores (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY)
            const dateWithSeparatorPattern = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g;
            const separatorMatches = [...text.matchAll(dateWithSeparatorPattern)];

            for (const match of separatorMatches) {
                const day = parseInt(match[1]);
                const month = parseInt(match[2]);
                const year = parseInt(match[3]);

                if (ValidationUtil.isValidDate(day, month, year)) {
                    const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                    this.logger.log(`[DataExtraction] Birth date extracted: ${formattedDate} from text: "${text}"`);
                    return {
                        extracted: true,
                        value: formattedDate,
                        confidence: 0.9,
                    };
                }
            }

            // Padrão 2: Data sem separadores (DDMMYYYY) - apenas se isolada
            // Usa word boundaries para evitar pegar parte de CPF
            const dateWithoutSeparatorPattern = /(?:^|\s)(\d{8})(?:\s|$)/g;
            const noSeparatorMatches = [...text.matchAll(dateWithoutSeparatorPattern)];

            for (const match of noSeparatorMatches) {
                const dateStr = match[1];
                const day = parseInt(dateStr.substring(0, 2));
                const month = parseInt(dateStr.substring(2, 4));
                const year = parseInt(dateStr.substring(4, 8));

                if (ValidationUtil.isValidDate(day, month, year)) {
                    const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                    this.logger.log(`[DataExtraction] Birth date extracted: ${formattedDate} from text: "${text}"`);
                    return {
                        extracted: true,
                        value: formattedDate,
                        confidence: 0.9,
                    };
                }
            }

            return { extracted: false };
        } catch (error) {
            this.logger.error('Error extracting birth date from text', error);
            return { extracted: false };
        }
    }
}
