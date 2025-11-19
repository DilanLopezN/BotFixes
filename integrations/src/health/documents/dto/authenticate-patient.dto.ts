import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthenticatePatientDto {
  @IsString()
  @ApiProperty()
  patientCpf: string;

  @IsString()
  @ApiProperty()
  erpUsername: string;
}
