import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DoAcceptDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  bornDate?: string;

  @IsBoolean()
  accept: boolean;
}
