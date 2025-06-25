import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsInt } from 'class-validator';

export class FilterWhatsappFlowLibraryDto {
    @ApiProperty({ description: 'Campo de busca pelo nome amigavel do biblioteca de flow' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'Campo de busca pela lista de IDs de categorias',
        type: [Number],
    })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    flowCategoryIds?: number[];

    @ApiProperty({
        description: 'Campo de busca por canais que possuem flow vinculado',
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    channels?: string[];

    @ApiProperty({
        description: 'Campo de busca por status do flow vinculado',
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    channelStatus?: string[];
}
