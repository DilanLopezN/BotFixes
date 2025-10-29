import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Max, Min, Validate } from 'class-validator';
import { CreateGeneralBreakSettingData } from '../interfaces/general-break-setting.interface';
import { ApiProperty } from '@nestjs/swagger';
import { TotalMaxDurationConstraint } from './total-max-duration-constraint.dto';

export class CreateGeneralBreakSettingDto implements CreateGeneralBreakSettingData {
    @ApiProperty({ description: 'ID do workspace (ObjectId do MongoDB)' })
    @IsOptional()
    @IsString()
    workspaceId: string;

    @ApiProperty({ description: 'Define se a pausa geral por inatividade está ativa', example: true })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiProperty({ description: 'Tempo em segundos para que seja apresentado o modal de inatividade', example: 30 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(28800, { message: 'O intervalo para a notificação de inatividade não pode ser maior que 28800' })
    notificationIntervalSeconds?: number;

    @ApiProperty({
        description: 'Tempo em segundos para que seja iniciada a pausa por inatividade após a notificação',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(28800, { message: 'O intervalo para começar a pausa por inatividade não pode ser maior que 28800' })
    breakStartDelaySeconds?: number;

    @ApiProperty({
        description: 'Tempo maximo em segundos para duração da pausa por inatividade',
        example: 60,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(28800, { message: 'A duração maxima da pausa por inatividade não pode ser maior que 28800' })
    maxInactiveDurationSeconds?: number;

    @ApiProperty({
        description: 'Lista de IDs de usuários excluídos da pausa automática',
        example: ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    excludedUserIds?: string[];

    // Propriedade fictícia para validar a soma
    @Validate(TotalMaxDurationConstraint)
    get total(): number {
        return (
            (this.notificationIntervalSeconds || 0) +
            (this.breakStartDelaySeconds || 0) +
            (this.maxInactiveDurationSeconds || 0)
        );
    }
}
