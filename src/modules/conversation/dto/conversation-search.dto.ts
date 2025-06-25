import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ConversationSearchDto {
    @IsString()
    @IsOptional()
    state?: string;

    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsString({ each: true })
    @IsOptional()
    teams?: string[];

    @IsNumber()
    @IsOptional()
    startDate?: number;

    @IsNumber()
    @IsOptional()
    endDate?: number;

    @IsString({ each: true })
    @IsOptional()
    channels?: string[];
}

export class ConversationSearchQueryDto {
    @IsString()
    @MinLength(4)
    @MaxLength(50)
    term: string;

    @IsOptional()
    @Transform((v) => Number(v))
    skip?: number;

    @IsOptional()
    @Transform((v) => Number(v))
    limit?: number;
}
