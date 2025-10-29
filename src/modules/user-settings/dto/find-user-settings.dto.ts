import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindUserSettingsDto {
    @ApiProperty({
        description: 'Tipo da configuração para filtrar (obrigatório)',
        example: 'pivot',
    })
    @IsNotEmpty()
    @IsString()
    type: string;
}
