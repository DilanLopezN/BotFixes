import { IsOptional, IsNumber, MaxLength } from 'class-validator';

export class SuspendConversationDto {
    @IsOptional()
    @IsNumber()
    until: number;
}