import { IsOptional, IsBoolean, IsNumber, Validate, IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AtLeastOneField } from './validate-field-break-change.dto';

export class BulkBreakChangeByAdminDto {
    @ApiPropertyOptional({ description: 'ID da pausa a ser aplicada no agente' })
    @IsOptional()
    @IsNumber()
    breakSettingId?: number;

    @ApiPropertyOptional({ description: 'Se verdadeiro, muda o agente para offline' })
    @IsOptional()
    @IsBoolean()
    changeToOffline?: boolean;

    // Validador aplicado em uma propriedade fake para validar se um dos campos acima esta preenchido
    @Validate(AtLeastOneField)
    dummy?: any;

    @ApiProperty({
        description: 'Lista de IDs dos usuários que devem sofrer a alteração',
        type: [String],
        example: ['user-1', 'user-2', 'user-3'],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    userIds: string[];
}
