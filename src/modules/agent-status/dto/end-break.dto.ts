import { IsOptional, IsString, MaxLength } from 'class-validator';

export class endBreakDto {
    @IsOptional()
    @IsString()
    @MaxLength(256, { message: 'A justificativa não pode ter mais de 256 caracteres.' })
    justification?: string;
}
