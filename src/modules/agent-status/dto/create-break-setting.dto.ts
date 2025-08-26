import { IsString, IsNumber, IsBoolean, Min, IsNotEmpty, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateBreakSettingData } from '../interfaces/break-setting.interface';

export class CreateBreakSettingDto implements Omit<CreateBreakSettingData, 'workspaceId'> {
    @ApiProperty({ description: 'Nome da pausa (ex: Pausa para almoço)' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Duração da pausa em segundos', example: 15 })
    @IsNumber()
    @Min(1)
    @Max(28800, { message: 'Tempo máximo da pausa de 28800 segundos' })
    durationSeconds: number;

    @ApiProperty({ description: 'Define se a pausa está ativa', example: true })
    @IsBoolean()
    enabled: boolean;
}
