import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class UpdatePasswordDto {
    @ApiProperty({
        description: 'Workspace User Password',
        type: String,
        required: true
    })
    @MinLength(8)
    @MaxLength(20)
    @Matches(/^(?=.*[!@#$%^&*()--__+.?=]){1,}.{0,}$/,
        {message: 'Password too weak - must have at least one special character'})
    @IsNotEmpty()
    password: string;
}