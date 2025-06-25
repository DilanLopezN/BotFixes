import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DefaultCreateTemplateMessageDto {
    @ApiProperty()
    @IsString()
    channelConfigId: string;

    @ApiProperty()
    @IsString()
    clientName: string;
}
