import { MaxLength, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {
    @MinLength(8)
    @MaxLength(20)
    newPassword: string;

    token: string;
}
