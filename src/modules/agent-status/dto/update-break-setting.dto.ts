import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateBreakSettingData } from '../interfaces/break-setting.interface';

export class UpdateBreakSettingDto implements UpdateBreakSettingData {
    @ApiProperty({ description: 'Nome da pausa (ex: Pausa para almoço)' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Duração da pausa em segundos', example: 15 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(28800, { message: 'Tempo máximo da pausa de 28800 segundos' })
    durationSeconds?: number;
}
