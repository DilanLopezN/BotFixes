import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DoTrainingDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    trainingEntryId?: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    forceAll?: boolean;
}
