import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class listMessagesByContextDto {
    @ApiProperty()
    @IsString()
    contextId: string;
}
