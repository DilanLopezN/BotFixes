import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class ProcedureDto {
  @IsOptional()
  @ApiProperty()
  @IsString()
  specialityCode?: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  code?: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  specialityType?: string;
}

class PartialPatientDto {
  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  cpf?: string;

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

export class CancelAppointmentDto {
  @IsString()
  @ApiProperty()
  appointmentCode: string;

  @IsOptional()
  @ApiProperty()
  @ValidateNested()
  @Type(() => PartialPatientDto)
  patient: PartialPatientDto;

  @IsString()
  @ApiProperty()
  patientCode: string;

  @IsOptional()
  @ApiProperty({ type: ProcedureDto })
  @ValidateNested()
  @Type(() => ProcedureDto)
  procedure: ProcedureDto;

  @IsOptional()
  @IsObject()
  data?: any;
}

export class CancelAppointmentV2Dto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  scheduleCode: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  scheduleId?: number;

  @IsOptional()
  @IsObject()
  @ApiProperty()
  erpParams?: any;
}
