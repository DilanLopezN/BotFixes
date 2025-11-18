import { IsBoolean, IsDefined, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentSortMethod } from '../../interfaces/appointment.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { ApiProperty } from '@nestjs/swagger';
import { FlowPeriodOfDay } from '../../flow/interfaces/flow.interface';
import { TypeOfService } from '../../entities/schema';

class PeriodDto {
  @IsString()
  @ApiProperty({ description: '00:00' })
  start: string;

  @IsString()
  @ApiProperty({ description: '15:00' })
  end: string;
}

class ListPatientDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  code?: string;

  @IsString()
  @ApiProperty()
  bornDate: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  sex: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  cpf: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  phone: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  weight?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  height?: number;
}

export class ListAvailableSchedulesDto {
  @IsNumber()
  @ApiProperty()
  limit: number;

  @IsNumber()
  @ApiProperty()
  fromDay: number;

  @IsNumber()
  @ApiProperty()
  untilDay: number;

  @IsBoolean()
  @ApiProperty()
  randomize: boolean;

  @ValidateNested()
  @ApiProperty({ type: PeriodDto })
  @Type(() => PeriodDto)
  period: PeriodDto;

  @IsEnum(AppointmentSortMethod)
  @ApiProperty({ enum: AppointmentSortMethod })
  @IsOptional()
  sortMethod?: AppointmentSortMethod;

  @IsOptional()
  @ApiProperty()
  @ValidateNested()
  @Type(() => ListPatientDto)
  patient?: ListPatientDto;

  @IsDefined()
  @ApiProperty()
  filter: CorrelationFilter;

  @IsOptional()
  @IsEnum(FlowPeriodOfDay)
  @ApiProperty({ enum: FlowPeriodOfDay })
  periodOfDay?: FlowPeriodOfDay;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  dateLimit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  appointmentCodeToCancel?: string;

  @IsOptional()
  @IsEnum(TypeOfService)
  @ApiProperty()
  scheduleType?: TypeOfService;
}
