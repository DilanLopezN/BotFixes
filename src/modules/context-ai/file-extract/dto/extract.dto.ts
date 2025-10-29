import { IsEnum, IsNotEmpty } from 'class-validator';
import { ExtractionType } from '../interfaces/file-extract.interface';

export class ExtractDto {
    @IsEnum(ExtractionType)
    @IsNotEmpty()
    extractionType: ExtractionType;
}