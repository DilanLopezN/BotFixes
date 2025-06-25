import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class AuthApiTokenDto {
    @ApiProperty({ type: String, example: 'email@email.com', description: 'email' })
    @IsString()
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({ type: Number, example: '10', description: 'only days' })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    readonly expiresIn: number;
}