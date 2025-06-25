import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AudioTranscriptionQueryDto {
    @ApiProperty({ description: 'activity id', type: String })
    @IsString()
    activityId: string;

    @ApiProperty({ description: 'created by', type: String })
    @IsString()
    createdBy: string;
}
