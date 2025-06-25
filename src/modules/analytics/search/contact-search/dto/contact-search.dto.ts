import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactSearchQueryDto {
    @IsOptional()
    @Transform((v) => Number(v))
    limit?: number;

    @IsOptional()
    @Transform((v) => Number(v))
    skip?: number;

    @IsOptional()
    @IsString()
    @MinLength(4)
    @MaxLength(50)
    term?: string;

    @IsOptional()
    @IsBoolean()
    @Transform((value) => Boolean(value))
    blocked?: boolean;
}
