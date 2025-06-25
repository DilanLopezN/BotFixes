import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class TransferConversationDto {
    @IsBoolean()
    leaveConversation: boolean;
}

export class TransferConversationToAgentDto {
    @IsString()
    agentId: string;

    @IsString()
    @IsOptional()
    teamId?: string;
}
