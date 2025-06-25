import { Length } from 'class-validator';

export class VerifyEmailDto {
    @Length(64, 64)
    token: string;
}
