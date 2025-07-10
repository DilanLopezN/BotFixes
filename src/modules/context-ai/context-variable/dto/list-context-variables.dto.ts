import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ListContextVariablesDto {
    @ApiProperty()
    @IsString()
    agentId: string;
}
