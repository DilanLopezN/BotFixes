import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BotsPublicationsHistoryDto {
    @ApiProperty()
    @IsString()
    readonly workspaceId: string;

    @ApiProperty()
    @IsString()
    readonly botId: string;

    @ApiProperty()
    @IsString()
    readonly userId: string;

    @ApiProperty()
    @IsString()
    readonly comment?: string;

    @ApiProperty()
    @IsNumber()
    readonly publishedAt: number;
}
