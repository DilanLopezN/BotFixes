import { IsString, MaxLength, MinLength } from 'class-validator';

export class TemplateMarketingInsightParamsDto {
    @IsString()
    @MinLength(20)
    @MaxLength(2048)
    message: string;
}
