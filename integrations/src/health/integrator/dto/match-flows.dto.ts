import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Patient } from '../../interfaces/patient.interface';
import { FlowPeriodOfDay, FlowSteps, FlowTriggerType } from '../../flow/interfaces/flow.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';

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
}

export class MatchFlowsDto {
  @IsEnum(FlowSteps)
  targetFlowType: FlowSteps;

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

  @IsOptional()
  @IsEnum(FlowTriggerType)
  @ApiProperty({ enum: FlowTriggerType })
  trigger?: FlowTriggerType;
}
