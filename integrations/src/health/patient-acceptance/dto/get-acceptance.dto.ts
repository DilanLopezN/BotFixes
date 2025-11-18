import { IsOptional, IsString } from 'class-validator';

export class GetAcceptanceDto {
  @IsOptional()
  @IsString()
  cpf?: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  bornDate?: string;
}
