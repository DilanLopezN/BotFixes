import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteTrainingEntryDto {
    @ApiProperty()
    @IsString()
    trainingEntryId: string;
}
