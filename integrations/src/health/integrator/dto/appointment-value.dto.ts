import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class ProcedureDto {
  @IsString()
  @ApiProperty()
  specialityCode: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  specialityType: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  code: string;
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

class DoctorDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  code: string;
}

class AppointmentTypeDto {
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
}

export class AppointmentValueDto {
  @IsDefined()
  @ApiProperty({ type: InsuranceDto })
  @ValidateNested()
  @Type(() => InsuranceDto)
  insurance: InsuranceDto;

  @IsOptional()
  @ApiProperty({ type: ProcedureDto })
  @ValidateNested()
  @Type(() => ProcedureDto)
  procedure: ProcedureDto;

  @IsOptional()
  @ApiProperty({ type: SpecialityDto })
  @ValidateNested()
  @Type(() => SpecialityDto)
  speciality?: SpecialityDto;

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
  @ApiProperty({ type: OrganizationUnitDto })
  @ValidateNested()
  @Type(() => OrganizationUnitDto)
  organizationUnit?: OrganizationUnitDto;

  @IsOptional()
  @IsString()
  @ApiProperty()
  scheduleCode?: string;

  @IsOptional()
  @IsObject()
  data?: any;
}
