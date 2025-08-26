import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';
import { EnableDisableBreakSettingBulkData } from '../interfaces/break-setting.interface';
import { ApiProperty } from '@nestjs/swagger';

export class EnableDisableBreakSettingBulkDto implements Omit<EnableDisableBreakSettingBulkData, 'workspaceId'> {
    @ApiProperty({ description: 'Array de ids das pausas que devem ser habilitadas/desabilitadas', example: [1, 2, 3] })
    @IsArray()
    @IsNumber({}, { each: true })
    ids: number[];

    @ApiProperty({ description: 'Define se a pausa está ativa', example: true })
    @IsBoolean()
    enabled: boolean;
}
