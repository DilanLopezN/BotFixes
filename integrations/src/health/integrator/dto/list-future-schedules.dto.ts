import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum AppointmentType {
  CONSULTA = 'C',
  EXAME = 'E',
  CIRURGIA = 'CI',
}

export class ListFutureSchedulesDto {
  @IsString()
  @ApiProperty()
  startDate: string;

  @IsString()
  @ApiProperty()
  endDate: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Array com códigos de convênios para filtrar',
    type: [String],
    required: false,
  })
  insuranceCode?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Array com códigos de agendamentos para filtrar',
    type: [String],
    required: false,
  })
  scheduleCode?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Array com códigos de médicos para filtrar',
    type: [String],
    required: false,
  })
  doctorCode?: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Status do agendamento (campo aberto que varia por sistema)',
    required: false,
    example: 'CONFIRMADO',
  })
  status?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  @ApiProperty({
    description: 'Tipo de agendamento',
    enum: AppointmentType,
    enumName: 'AppointmentType',
    required: false,
    example: AppointmentType.CONSULTA,
  })
  appointmentType?: AppointmentType;
}
