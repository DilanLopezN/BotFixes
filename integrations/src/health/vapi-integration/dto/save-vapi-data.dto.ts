import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { VapiIntegrationData } from '../interfaces/vapi-integration-data.interface';
import { EntityType } from '../../interfaces/entity.interface';

export class SaveVapiDataInputDto {
  @IsString()
  @ApiProperty({ required: true, description: 'Call ID', example: 'call-123' })
  callId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Doctor code', example: 'DOC123' })
  doctorCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Organization unit code', example: 'ORG456' })
  organizationUnitCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Insurance code', example: 'INS789' })
  insuranceCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Procedure code', example: 'PROC001' })
  procedureCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Speciality code', example: 'SPEC001' })
  specialityCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Appointment type code', example: 'AT001' })
  appointmentTypeCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Patient code', example: 'PAT001' })
  patientCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Patient CPF', example: '12345678900' })
  patientCpf?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Patient born date', example: '1990/01/15' })
  patientBornDate?: string;

  @IsOptional()
  @IsEnum(EntityType)
  @ApiProperty({ required: false, enum: EntityType, description: 'Entity type', example: 'doctor' })
  entityType?: EntityType;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Schedule code', example: 'SCHED001' })
  scheduleCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Schedule date in format YYYY/MM/DD HH:mm',
    example: '2024/01/20 14:00',
  })
  scheduleDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Schedule duration', example: '30' })
  scheduleDuration?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Insurance plan code', example: 'PLAN001' })
  insurancePlanCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Insurance plan category code', example: 'CAT001' })
  insurancePlanCategoryCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Insurance sub plan code', example: 'SUB001' })
  insuranceSubPlanCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Speciality type', example: 'C' })
  specialityType?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Type of service code', example: 'TOS001' })
  typeOfServiceCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Schedule type', example: 'firstAppointment' })
  scheduleType?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Laterality code', example: 'LAT001' })
  lateralityCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Duration', example: '30' })
  duration?: string;

  @IsString()
  @ApiProperty({ required: false, description: 'Phone number for sendMessage', example: '32999876075' })
  phoneNumber: string;

  @IsString()
  @ApiProperty({
    required: false,
    description: 'API token for sendMessage',
    example: 'db178bfa-5937-4c23-992b-766a98031921',
  })
  apiToken: string;
}

export class SaveVapiDataOutputDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  integrationId: string;
}
