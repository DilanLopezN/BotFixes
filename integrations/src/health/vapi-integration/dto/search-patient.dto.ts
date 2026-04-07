import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { PatientFilters } from '../../integrator/interfaces/patient-filters.interface';
import { Patient } from '../../interfaces/patient.interface';

export class SearchPatientInputDto implements PatientFilters {
  @IsString()
  @ApiProperty({ required: true, description: 'Call ID', example: 'call-123' })
  callId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  cpf?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  code?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  bornDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  motherName?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  cache?: boolean;

  @IsOptional()
  @ApiProperty({ required: false })
  data?: any;
}

export class SearchPatientOutputDto implements Patient {
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  socialName?: string;

  @ApiProperty()
  cpf: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  sex?: string;

  @ApiProperty()
  bornDate: string;

  @ApiProperty({ required: false })
  identityNumber?: string;

  @ApiProperty({ required: false })
  cellPhone?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  code?: string;

  @ApiProperty({ required: false })
  motherName?: string;

  @ApiProperty({ required: false })
  height?: number;

  @ApiProperty({ required: false })
  weight?: number;

  @ApiProperty({ required: false })
  skinColor?: string;

  @ApiProperty({ required: false })
  data?: {
    erpId?: string;
    codUsuario?: string;
  };
}
