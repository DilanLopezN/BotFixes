import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserSettingsBodyDto {
    @ApiProperty({
        description: 'Tipo da configuração',
        example: 'pivot',
    })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty({
        description: 'Chave da configuração',
        example: 'my-custom-view',
    })
    @IsNotEmpty()
    @IsString()
    key: string;

    @ApiProperty({
        description: 'Novo valor da configuração',
        example: '{"columns":["name","email","phone"],"filters":{"status":"active"}}',
    })
    @IsNotEmpty()
    @IsString()
    value: string;

    @ApiProperty({
        description: 'Label opcional para a configuração',
        example: 'Minha visualização atualizada',
        required: false,
    })
    @IsOptional()
    @IsString()
    label?: string;
}
