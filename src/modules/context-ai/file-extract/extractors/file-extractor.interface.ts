import { ExtractionType } from '../interfaces/file-extract.interface';

export interface FileExtractor {
    name: ExtractionType;
    description: string;
    generatePrompt(): string;
    validateExtractedData?(data: Record<string, any>): boolean;
    formatResponse?(data: Record<string, any>): Record<string, any>;
}