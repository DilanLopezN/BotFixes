export enum ExtractionType {
    CARTEIRINHA_BENEFICIARIO = 'carteirinha_beneficiario',
}

export interface IFileExtract {
    id: string;
    workspaceId: string;
    extractionType: ExtractionType;
    filename: string;
    responseTimeMs: number;
    extractedContent: Record<string, any>;
    inputTokens: number;
    outputTokens: number;
    createdAt: Date;
}

export interface ExtractionRequest {
    workspaceId: string;
    file: Express.Multer.File;
    extractionType: ExtractionType;
}

export interface ExtractionResult {
    id: string;
    extractedContent: Record<string, any>;
    inputTokens: number;
    outputTokens: number;
}
