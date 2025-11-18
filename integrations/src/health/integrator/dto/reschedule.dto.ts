import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateAppointmentDto } from './create-appointment.dto';

class PartialPatientDto {
  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '1985-11-14' })
  bornDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  insuranceNumber?: string;
}

export class RescheduleDto {
  @ApiProperty()
  @IsString()
  scheduleToCancelCode: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PartialPatientDto)
  patient: PartialPatientDto;

  @ApiProperty({ type: CreateAppointmentDto })
  @ValidateNested()
  @Type(() => CreateAppointmentDto)
  scheduleToCreate: CreateAppointmentDto;
}
