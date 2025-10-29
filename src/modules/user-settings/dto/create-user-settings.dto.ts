import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserSettingsDto {
    @ApiProperty({
        description: 'Chave única para identificar a configuração',
        example: 'saved_view_1',
    })
    @IsNotEmpty()
    @IsString()
    key: string;

    @ApiProperty({
        description: 'Valor da configuração (pode ser qualquer string, JSON stringificado, etc)',
        example: '{"columns":["name","email"],"filters":{}}',
    })
    @IsNotEmpty()
    @IsString()
    value: string;

    @ApiProperty({
        description: 'Tipo da configuração (ex: pivot, dashboard, table_view, etc)',
        example: 'pivot',
    })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty({
        description: 'Label opcional para a configuração',
        example: 'Minha visualização personalizada',
        required: false,
    })
    @IsOptional()
    @IsString()
    label?: string;
}
