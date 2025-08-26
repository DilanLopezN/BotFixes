import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BreakSetting } from '../models/break-setting.entity';

export class FilterBreakSettingDto implements Pick<BreakSetting, 'enabled' | 'name'> {
    @ApiProperty({ description: 'Busca pelo nome do intervalo', example: 'Almoço' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Busca por intervalos ativos/inativos', example: true })
    @IsBoolean()
    enabled: boolean;
}
