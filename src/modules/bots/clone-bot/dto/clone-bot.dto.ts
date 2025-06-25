import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CloneBotDto {
    @IsString()
    botName: string;

    @IsString()
    cloneFromWorkspaceId: string;

    @IsString()
    cloneFromBotId: string;

    @IsBoolean()
    @IsOptional()
    createTeams?: boolean;
}
