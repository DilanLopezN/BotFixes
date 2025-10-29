import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserSettingsDto {
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
}
