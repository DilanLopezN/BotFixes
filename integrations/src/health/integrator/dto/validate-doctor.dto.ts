import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length, Max, Min } from 'class-validator';

export class ValidateDoctorDto {
  @IsNumber()
  @Min(1)
  @Max(9999999) // garante que tenha no máximo 7 dígitos
  @ApiProperty({ description: 'CRM do médico, até 7 dígitos' })
  crm: number;

  @IsString()
  @Length(2, 2)
  @ApiProperty({ description: 'UF, exatamente 2 caracteres' })
  uf: string;
}
