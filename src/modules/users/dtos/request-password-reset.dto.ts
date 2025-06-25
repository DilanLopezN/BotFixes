import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RequestPasswordOrMailResetDto {
    @ApiProperty()
    @IsString()
    email: string;
}
