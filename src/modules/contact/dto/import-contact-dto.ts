import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ImportContactDto {
    @IsString()
    @ApiProperty({ type: String })
    name: string;

    @IsString()
    @ApiProperty({ type: String })
    phone: string;
}
