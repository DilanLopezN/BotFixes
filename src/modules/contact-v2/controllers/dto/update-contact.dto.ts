import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateContactDto {
    @ApiProperty({ type: String })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ type: String })
    @IsString()
    name: string;

    @ApiProperty({ type: String })
    @IsOptional()
    ddi?: string;

    @ApiProperty({ type: String })
    @IsOptional()
    phone?: string;
}
