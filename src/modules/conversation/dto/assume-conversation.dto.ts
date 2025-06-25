import { IsString } from 'class-validator';

export class AssumeConversationDto {
    @IsString()
    teamId: string;
}