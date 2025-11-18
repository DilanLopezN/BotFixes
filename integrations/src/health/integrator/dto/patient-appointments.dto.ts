import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FlowSteps } from '../../flow/interfaces/flow.interface';
import { PatientSchedulesTarget } from '../interfaces/patient-schedules.interface';

class PartialPatientDto {
  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  cpf: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '1985-11-14' })
  bornDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  phone?: string;
}

class PatientSchedulesDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => PartialPatientDto)
  patient: PartialPatientDto;

  @IsOptional()
  @ApiProperty()
  @IsNumber()
  @Transform((v) => Number(v))
  startDate: number;

  @IsOptional()
  @ApiProperty()
  @IsNumber()
  @Transform((v) => Number(v))
  endDate: number;

  @IsOptional()
  @ApiProperty()
  @IsEnum([FlowSteps.cancel, FlowSteps.reschedule, FlowSteps.listPatientSchedules, FlowSteps.confirmPassive])
  target: PatientSchedulesTarget;

  @IsString()
  @IsOptional()
  @ApiProperty()
  specialityCode?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  organizationUnitLocationCode?: string;
}

export { PatientSchedulesDto };
