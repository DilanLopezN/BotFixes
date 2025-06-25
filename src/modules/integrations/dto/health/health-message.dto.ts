import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateIntegrationMessageDto {
    @ApiProperty()
    @IsString()
    message: string;
}
