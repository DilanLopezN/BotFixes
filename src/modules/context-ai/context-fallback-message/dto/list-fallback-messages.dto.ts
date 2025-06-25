import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ListFallbackMessagesDto {
    @ApiProperty()
    @IsString()
    startDate: string;

    @ApiProperty()
    @IsString()
    endDate: string;
}
