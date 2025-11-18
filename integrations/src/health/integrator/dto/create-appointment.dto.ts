import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TypeOfService } from '../../entities/schema';

class AppointmentDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  duration: string;

  @IsString()
  @ApiProperty()
  appointmentDate: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsOptional()
  data?: any;
}

class DoctorDto {
  @IsString()
  @ApiProperty()
  code: string;
}

class TypeOfServiceDto {
  @IsString()
  @ApiProperty()
  code: string;
}

class OrganizationUnitDto {
  @IsString()
  @ApiProperty()
  code: string;
}

class SpecialityDto {
  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  specialityType?: string;
}

class AppointmentTypeDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  code: string;
}

class ProcedureDto {
  @IsString()
  @ApiProperty()
  specialityCode: string;

  @IsString()
  @ApiProperty()
  specialityType: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsOptional()
  @ApiProperty()
  data: any;
}

class InsuranceDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  planCode: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  subPlanCode?: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  planCategoryCode?: string;
}

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
  insuranceNumber?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: ['M', 'F'] })
  sex?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  identityNumber?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: ['48984755547', '47998145558'] })
  cellPhone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: ['4832541114', '4732558874'] })
  @IsOptional()
  phone?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  height?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  weight?: number;

  @IsOptional()
  data?: any;
}

export class CreateAppointmentDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => PartialPatientDto)
  patient: PartialPatientDto;

  @IsDefined()
  @ApiProperty({ type: AppointmentDto })
  @ValidateNested()
  @Type(() => AppointmentDto)
  appointment: AppointmentDto;

  @IsDefined()
  @ApiProperty({ type: InsuranceDto })
  @ValidateNested()
  @Type(() => InsuranceDto)
  insurance: InsuranceDto;

  @IsOptional()
  @ApiProperty({ type: OrganizationUnitDto })
  @ValidateNested()
  @Type(() => OrganizationUnitDto)
  organizationUnit: OrganizationUnitDto;

  @IsOptional()
  @ApiProperty({ type: SpecialityDto })
  @ValidateNested()
  @Type(() => SpecialityDto)
  speciality?: SpecialityDto;

  @IsOptional()
  @ApiProperty({ type: ProcedureDto })
  @ValidateNested()
  @Type(() => ProcedureDto)
  procedure: ProcedureDto;

  @IsOptional()
  @ApiProperty({ type: DoctorDto })
  @ValidateNested()
  @Type(() => DoctorDto)
  doctor?: DoctorDto;

  @IsOptional()
  @ApiProperty({ type: AppointmentTypeDto })
  @ValidateNested()
  @Type(() => AppointmentTypeDto)
  appointmentType?: AppointmentTypeDto;

  @IsOptional()
  @ApiProperty({ type: TypeOfServiceDto })
  @ValidateNested()
  @Type(() => TypeOfServiceDto)
  typeOfService?: TypeOfServiceDto;

  @IsOptional()
  @IsEnum(TypeOfService)
  @ApiProperty()
  scheduleType?: TypeOfService;

  @IsOptional()
  @ApiProperty()
  data?: Record<string, any>;
}
