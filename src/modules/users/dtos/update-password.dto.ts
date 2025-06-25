import { MaxLength, MinLength } from "class-validator";

export class UpdatePasswordDto {
    oldPassword: string;

    @MinLength(8)
    @MaxLength(20)
    password: string;
}