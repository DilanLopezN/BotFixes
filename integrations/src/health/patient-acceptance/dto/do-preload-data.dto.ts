import { IsOptional, IsString } from 'class-validator';

export class DoPreloadDataDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  bornDate?: string;
}
