import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateContactDto {
    @ApiProperty({ type: String })
    @IsNumber()
    phone: string;

    @ApiProperty({ type: String })
    @IsOptional()
    email?: string;

    @ApiProperty({ type: String })
    @IsString()
    name: string;

    @ApiProperty({ type: String })
    whatsapp: string;

    @ApiProperty({ type: String })
    @IsOptional()
    ddi?: string;

    @IsString()
    @ApiProperty({ type: String })
    createdByChannel: string;
}
