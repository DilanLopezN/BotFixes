import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Patient } from '../../interfaces/patient.interface';
import { FlowPeriodOfDay } from '../../flow/interfaces/flow.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { EntityType } from '../../interfaces/entity.interface';

class PartialPatientDto implements Partial<Patient> {
  @IsString()
  @IsOptional()
  @ApiProperty()
  cpf: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '1985-11-14' })
  bornDate: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  sex: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  code?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  phone?: string;
}

export class EntityListByTextDto {
  @IsEnum(EntityType)
  @ApiProperty({ enum: EntityType })
  targetEntity: EntityType;

  @IsString()
  @ApiProperty()
  text: string;

  @IsDefined()
  @ApiProperty()
  filter: CorrelationFilter;

  @IsOptional()
  @ApiProperty()
  @ValidateNested()
  @Type(() => PartialPatientDto)
  patient?: PartialPatientDto;

  @IsOptional()
  @IsEnum(FlowPeriodOfDay)
  @ApiProperty({ enum: FlowPeriodOfDay })
  periodOfDay?: FlowPeriodOfDay;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  cache?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  dateLimit?: number;
}
