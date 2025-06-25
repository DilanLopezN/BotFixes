import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateRatingValueDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    @ApiProperty()
    value: number;
}

export class UpdateRatingDto {
    @IsOptional()
    @IsString()
    @MaxLength(400)
    @ApiProperty()
    feedbackMessage: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    @ApiProperty()
    value: number;
}
