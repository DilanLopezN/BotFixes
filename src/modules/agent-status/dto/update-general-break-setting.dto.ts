import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Max, Min, Validate } from 'class-validator';
import { UpdateGeneralBreakSettingData } from '../interfaces/general-break-setting.interface';
import { TotalMaxDurationConstraint } from './total-max-duration-constraint.dto';

export class UpdateGeneralBreakSettingDto implements UpdateGeneralBreakSettingData {
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(28800, { message: 'O intervalo para a notificação de inatividade não pode ser maior que 28800' })
    notificationIntervalSeconds?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(28800, { message: 'O intervalo para começar a pausa por inatividade não pode ser maior que 28800' })
    breakStartDelaySeconds?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(28800, { message: 'A duração maxima da pausa por inatividade não pode ser maior que 28800' })
    maxInactiveDurationSeconds?: number;

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
