import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmAppointmentDto {
  @IsString()
  @ApiProperty()
  appointmentCode: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  appointmentDate: string;

  @IsString()
  @ApiProperty()
  patientCode: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  specialityType: string;

  @IsOptional()
  @IsObject()
  data?: any;
}

export class ConfirmAppointmentV2Dto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  scheduleCode?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  scheduleId?: number;

  @IsOptional()
  @IsObject()
  @ApiProperty()
  erpParams?: any;
}
