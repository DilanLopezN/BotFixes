import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Patient } from '../../interfaces/patient.interface';

class PatientDto implements Patient {
  @IsString()
  @IsOptional()
  @ApiProperty()
  code?: string;

  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  cpf: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  motherName?: string;

  @IsString()
  @ApiProperty({ example: ['M', 'F'] })
  sex: string;

  @IsString()
  @ApiProperty({ example: '1985-11-14' })
  bornDate: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  identityNumber?: string;

  @IsString()
  @ApiProperty({ example: ['48984755547', '47998145558'] })
  cellPhone?: string;

  @IsString()
  @ApiProperty({ example: ['4832541114', '4732558874'] })
  @IsOptional()
  phone?: string;

  @IsNumber()
  @ApiProperty()
  @IsOptional()
  height?: number;

  @IsNumber()
  @ApiProperty()
  @IsOptional()
  weight?: number;

  @IsString()
  @ApiProperty()
  @IsOptional()
  skinColor?: string;
}

export class UpdatePatientDto {
  @IsDefined()
  @ApiProperty({ type: PatientDto })
  @ValidateNested()
  @Type(() => PatientDto)
  patient: PatientDto;
}
