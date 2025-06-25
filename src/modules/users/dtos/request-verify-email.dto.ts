import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RequestVerifyEmailDto {
    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsString()
    newMail?: string;
}
