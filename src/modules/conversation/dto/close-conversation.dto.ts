import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseConversationDto {
    @IsOptional()
    @IsString()
    @MaxLength(4096)
    message: string;
}