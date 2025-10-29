import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleFilterListDto } from './schedule-query.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { typeDownloadEnum } from '../../../common/utils/downloadFileType';

export class ScheduleExportDto {
    @ApiProperty({
        description: 'Filtros aplicados na listagem',
        type: ScheduleFilterListDto,
    })
    @ValidateNested()
    @Type(() => ScheduleFilterListDto)
    filter: ScheduleFilterListDto;

    @ApiPropertyOptional({
        description: 'Colunas selecionadas para exportação',
        type: [String],
        example: ['patientCode', 'patientName', 'doctorName', 'status'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    selectedColumns?: string[];

    @ApiPropertyOptional({
        description: 'Tipo de download',
        enum: typeDownloadEnum,
        example: typeDownloadEnum.CSV,
    })
    @IsOptional()
    @IsEnum(typeDownloadEnum)
    downloadType?: typeDownloadEnum;
}
