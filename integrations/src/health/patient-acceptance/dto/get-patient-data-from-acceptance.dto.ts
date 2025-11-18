import { IsOptional, IsString } from 'class-validator';

export class GetPatientDataFromAcceptanceDto {
  @IsOptional()
  @IsString()
  cpf?: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  bornDate?: string;
}
