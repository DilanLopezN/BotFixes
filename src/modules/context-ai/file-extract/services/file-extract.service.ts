import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileExtract } from '../entities/file-extract.entity';
import { ExtractionType, ExtractionRequest, ExtractionResult } from '../interfaces/file-extract.interface';
import { CONTEXT_AI } from '../../ormconfig';
import { AiProviderService } from '../../ai-provider/ai.service';
import { AiExecute, AIProviderType } from '../../ai-provider/interfaces';
import { FileExtractorRegistry } from '../extractors';

@Injectable()
export class FileExtractService {
    constructor(
        @InjectRepository(FileExtract, CONTEXT_AI)
        private readonly fileExtractRepository: Repository<FileExtract>,
        private readonly aiProviderService: AiProviderService,
        private readonly fileExtractorRegistry: FileExtractorRegistry,
    ) {}

    private getPromptForExtractionType(type: ExtractionType): string {
        const extractor = this.fileExtractorRegistry.getExtractor(type).generatePrompt();
        return extractor;
    }

    async extractDataFromImage(request: ExtractionRequest): Promise<ExtractionResult> {
        const { workspaceId, file, extractionType } = request;

        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Arquivo deve ser uma imagem');
        }

        const extractor = this.fileExtractorRegistry.getExtractor(extractionType);

        if (!extractor) {
            throw new BadRequestException('Arquivo deve ser uma imagem');
        }

        const prompt = this.getPromptForExtractionType(extractionType);
        const imageBase64 = file.buffer.toString('base64');

        const aiRequest: AiExecute = {
            provider: AIProviderType.google,
            messages: [
                {
                    role: 'user',
                    content: `${prompt}\n\nAnalise a imagem enviada e extraia as informações solicitadas.`,
                },
            ],
            prompt: `${prompt}\n\nAnalise a imagem enviada e extraia as informações solicitadas.`,
            model: 'gemini-2.5-flash',
            maxTokens: 2_054,
            image: {
                data: imageBase64,
                mimeType: file.mimetype,
            },
        };

        try {
            const startTime = Date.now();
            const aiResponse = await this.aiProviderService.execute(aiRequest);
            const responseTimeMs = Date.now() - startTime;

            let extractedContent: Record<string, any>;
            try {
                extractedContent = JSON.parse(aiResponse.message);
            } catch (parseError) {
                throw new BadRequestException('Resposta da IA não está em formato JSON válido');
            }

            if (extractor.validateExtractedData && !extractor.validateExtractedData(extractedContent)) {
                throw new BadRequestException('Dados extraídos não passaram na validação');
            } else if (extractor.formatResponse) {
                extractedContent = extractor.formatResponse(extractedContent);
            }

            const savePromise = this.fileExtractRepository.save(
                this.fileExtractRepository.create({
                    workspaceId,
                    extractionType,
                    filename: file.originalname,
                    responseTimeMs,
                    extractedContent,
                    inputTokens: aiResponse.promptTokens || 0,
                    outputTokens: aiResponse.completionTokens || 0,
                }),
            );

            const [savedExtraction] = await Promise.all([savePromise]);

            return {
                id: savedExtraction.id,
                extractedContent,
                inputTokens: aiResponse.promptTokens || 0,
                outputTokens: aiResponse.completionTokens || 0,
            };
        } catch (error) {
            throw new BadRequestException(`Erro ao processar extração: ${error.message}`);
        }
    }
}
