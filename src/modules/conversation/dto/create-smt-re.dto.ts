import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSmtReDto {
    @ApiProperty({
        description: 'ID do setting de smart reengagement',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsNotEmpty()
    smtReSettingId: string;
}