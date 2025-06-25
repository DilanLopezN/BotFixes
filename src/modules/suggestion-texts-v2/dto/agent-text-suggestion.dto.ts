import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SuggestionTone } from '../interfaces/suggestion-texts.interface';

export class AgentSuggestionTextParamsDto {
    @IsString()
    @MinLength(20)
    @MaxLength(2048)
    message: string;

    @IsString()
    @IsOptional()
    @MinLength(3)
    @IsEnum(SuggestionTone)
    suggestionTone?: SuggestionTone;
}
