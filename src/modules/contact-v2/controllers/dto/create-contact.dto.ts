import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateContactDto {
    @ApiProperty({ type: String })
    @IsString()
    phone: string;

    @ApiProperty({ type: String })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ type: String })
    @IsString()
    name: string;

    @ApiProperty({ type: String })
    @IsString()
    whatsapp: string;

    @ApiProperty({ type: String })
    @IsOptional()
    ddi?: string;

    @ApiProperty({ type: String })
    @IsString()
    createdByChannel: string;
}
