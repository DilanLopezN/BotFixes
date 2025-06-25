import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetTrainingEntryDto {
    @ApiProperty()
    @IsString()
    trainingEntryId: string;
}
