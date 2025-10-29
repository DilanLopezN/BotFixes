import { Injectable } from '@nestjs/common';
import { ExtractionType } from '../../interfaces/file-extract.interface';
import { CarteirinhaBeneficiarioFileExtractor } from '../implementations';
import { FileExtractor } from '../file-extractor.interface';

@Injectable()
export class FileExtractorRegistry {
    private allExtractors: Map<ExtractionType, FileExtractor> = new Map();

    constructor(private readonly carteirinhaBeneficiarioExtractor: CarteirinhaBeneficiarioFileExtractor) {
        this.allExtractors.set(ExtractionType.CARTEIRINHA_BENEFICIARIO, this.carteirinhaBeneficiarioExtractor);
    }

    getExtractor(extractionType: ExtractionType): FileExtractor | undefined {
        return this.allExtractors.get(extractionType);
    }

    getAllExtractors(): FileExtractor[] {
        return Array.from(this.allExtractors.values());
    }

    getAvailableTypes(): ExtractionType[] {
        return Array.from(this.allExtractors.keys());
    }
}
