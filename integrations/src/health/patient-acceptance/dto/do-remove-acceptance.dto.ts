import { IsOptional, IsString } from 'class-validator';

export class DoRemoveAcceptanceDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  bornDate?: string;
}
