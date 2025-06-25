import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ActivitySearchQueryDto {
    @IsString()
    @MinLength(4)
    @MaxLength(50)
    q: string;

    @IsOptional()
    @Transform((v) => Number(v))
    skip?: number;

    @IsOptional()
    @Transform((v) => Number(v))
    limit?: number;
}
