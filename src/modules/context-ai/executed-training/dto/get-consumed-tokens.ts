import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetConsumedTokensDto {
    @ApiProperty()
    @IsString()
    startDate: string;

    @ApiProperty()
    @IsString()
    endDate: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    agentId?: string;
}
